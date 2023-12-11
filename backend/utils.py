from typing import Any, Dict, List, Tuple
from io import BytesIO
import os
import logging
import regex as re
from backend.sources import qdrant_client, embedding
from langchain.vectorstores import Qdrant
import docx2txt
import fitz
from hashlib import md5
from langchain.llms import OpenAI
from langchain.chains import ConversationalRetrievalChain, RetrievalQA
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory
from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
)
import openai
from langchain.prompts.prompt import PromptTemplate
from .config import OPEN_AI_KEY
from .sources import qdrant_client
import ocrmypdf

EMBEDDING_RATE_LIMIT = 10**5


def load_files(files) -> List[Document]:
    pages = []
    for file in files:
        filetype = file.content_type
        if filetype == "application/pdf":
            pdf = fitz.open(stream=file.read(), filetype="pdf")
            if not check_pdf(pdf):
                try:
                    re_orced_pdf = OCR(file)
                    re_orced_pdf.seek(0)
                    pdf = fitz.open(stream=re_orced_pdf.read(), filetype="pdf")
                except Exception as e:
                    # TODO: handle ocr error for large pdf files.
                    print(f"{file.name} OCR failed")
                    print(e)
                    continue
            pages += load_pdf(pdf, file.name)
        elif (
            filetype
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            pages += load_docx(file)
        elif filetype == "text/plain":
            pages += load_txt(file)
        else:
            raise ValueError(f"File type {filetype} not supported")

    return pages


def load_pdf(file, name):
    pdf = parse_pdf(file)
    loader = text_to_docs(pdf, name, 600)
    return loader


def load_docx(file):
    extracted_text = docx2txt.process(file)
    txt = parse_txt(extracted_text)
    loader = text_to_docs(txt, file.name, 600)
    return loader


def load_txt(file):
    txt = parse_txt(str(file.read()))
    loader = text_to_docs(txt, file.name, 600)
    return loader


def parse_pdf(file) -> List[str]:
    output = []
    for page in file:
        text = page.get_text()
        # Merge hyphenated words
        text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
        # Fix newlines in the middle of sentences
        text = re.sub(r"(?<!\n\s)\n(?!\s\n)", " ", text.strip())
        # Remove multiple newlines
        text = re.sub(r"\n\s*\n", "\n\n", text)

        # remove space between chinese characters while keeping space between english words
        rex = r"(?<![a-zA-Z]{2})(?<=[a-zA-Z]{1})[ ]+(?=[a-zA-Z] |.$)|(?<=\p{Han}) +"

        text = re.sub(rex, "", text, 0, re.MULTILINE | re.UNICODE)
        output.append(text)
    return output


def parse_txt(extracted_text: BytesIO) -> List[str]:
    extracted_text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", extracted_text)
    # Fix newlines in the middle of sentences
    extracted_text = re.sub(r"(?<!\n\s)\n(?!\s\n)", " ", extracted_text)
    # Remove multiple newlines
    extracted_text = re.sub(r"\n\s*\n", "\n\n", extracted_text)

    return extracted_text


def text_to_docs(text: str, file_name: str, chunk_size: int) -> List[Document]:
    """Converts a string or list of strings to a list of Documents
    with metadata."""
    if isinstance(text, str):
        # Take a single string as one page

        text = (
            [text]
            if len(text) <= EMBEDDING_RATE_LIMIT
            else [
                text[i : i + EMBEDDING_RATE_LIMIT]
                for i in range(0, len(text), EMBEDDING_RATE_LIMIT)
            ]
        )
    page_docs = [Document(page_content=page) for page in text]

    # Add page numbers as metadata
    for i, doc in enumerate(page_docs):
        doc.metadata["page"] = i + 1

    # Split pages into chunks
    doc_chunks = []

    for doc in page_docs:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
            chunk_overlap=0,
        )
        chunks = text_splitter.split_text(doc.page_content)
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk, metadata={"page": doc.metadata["page"], "chunk": i}
            )
            # Add sources a metadata
            doc.metadata[
                "source"
            ] = f"{file_name}-{doc.metadata['page']}-{doc.metadata['chunk']}"
            doc_chunks.append(doc)
    return doc_chunks


CONTENT_KEY = "page_content"
METADATA_KEY = "metadata"


def upsert_documents_to_qdrant(
    pages: List[Document],
    collection_name: str = "my_documents",
):
    texts = [x.page_content for x in pages]
    metadatas = [x.metadata for x in pages]
    embeddings = embedding.embed_documents(texts)
    ids = [md5(text.encode("utf-8")).hexdigest() for text in texts]
    from qdrant_client.http import models as rest

    try:
        qdrant_client.upsert(
            collection_name=collection_name,
            points=rest.Batch.construct(
                ids=ids,
                vectors=embeddings,
                payloads=Qdrant._build_payloads(
                    texts=texts,
                    metadatas=metadatas,
                    content_payload_key="page_content",
                    metadata_payload_key="metadata",
                ),
            ),
        )
    except Exception as e:
        print(e)


## TODO: model parameters to method parameters
def load_chain(collection_name: str, model_name: str):
    qdrant = Qdrant(
        client=qdrant_client, collection_name=collection_name, embeddings=embedding
    )

    # ConversationalRetrievalChain
    qa = ConversationalRetrievalChain.from_llm(
        ChatOpenAI(model_name=model_name, openai_api_key=OPEN_AI_KEY, temperature=0),
        retriever=qdrant.as_retriever(
            search_type="mmr", search_kwargs={"k": 10, "search_distance": 0.8}
        ),  # search_type="mmr", search_kwargs={"k": 20}),
        verbose=True,
        return_source_documents=True,
    )

    return qa


def single_source_qa(question: str, source: str):
    response = openai.ChatCompletion.create(
        messages=[
            {
                "role": "system",
                "content": f'Use the following pieces of context to answer the question at the end. If you do not know the answer, just say that you don not know, don not try to make up an answer."{source}" Answer in Chinese',
            },
            {"role": "user", "content": question},
        ],
        model="gpt-4",
        temperature=0,
    )
    return response["choices"][0]["message"]["content"]


def format_source(source_documents: List[Document]):
    res = ""
    for i, doc in enumerate(source_documents):
        res += f"source {i + 1} \n"
        res += f'   page: {doc.metadata["source"]} \n'
        res += f"   content: {doc.page_content} \n"
    return res


def format_answer(res):
    # sources for qa
    ans = {"answer": res["answer"], "source": format_source(res["source_documents"])}
    return ans


def check_pdf(pdf):
    ## check first 3 pages for text
    test_pages = 3 if len(pdf) > 3 else len(pdf)
    s = set()
    for i in range(test_pages):
        cleaned_text = re.sub(r"[\ufffd\n ]", "", pdf[i].get_text())
        s.add(cleaned_text)
    return len(s) > 1


def OCR(file):
    """_summary_

    Args:
        file (_ByteIO_): _input pdf_

    Returns:
        _ByteIO_: _re_ocred output pdf_
    """
    # print(file.content_type)
    # if file.content_type != "application/pdf":
    #     raise Exception("Only pdf files are supported")
    output = BytesIO()
    file.seek(0)
    ocrmypdf.ocr(
        input_file=BytesIO(file.read()),
        output_file=output,
        language=["eng", "chi_sim"],
        redo_ocr=True,
    )
    if not output:
        raise Exception("OCR failed")
    return output
