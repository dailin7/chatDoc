from ..serializers import ConversationSerializer
from ..models.models import Conversation
from django.core.exceptions import ValidationError
import json
from ..utils import format_source


def create_conversation(data):
    serializer = ConversationSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return serializer.data
    else:
        raise ValidationError("Invalid data")


def find_answer(question: str, answer: dict, match_ratio: int = 0.5):
    """_find complete machin in source documents,
    if there exists a match, return [source]. Otherwise return the whole sources_

    Args:
        question (str): _the user input question_
        answer (dict): _the answer from db and llm_
        match_ratio (int, optional): _how many characters should match respect to the question_. Defaults to 0.5.

    """
    # change the matching length adaptively based on the question length
    if len(question) <= 3:
        match_ratio = 1
    elif len(question) <= 8:
        match_ratio = 0.8

    match_ratio_len = int(len(question) * match_ratio)

    for i in range(len(answer["source_documents"])):
        cleaned_source = "".join(answer["source_documents"][i].page_content.split())
        for j in range(0, len(question) - match_ratio_len):
            cleaned_question = "".join(question[j : j + match_ratio_len].split())
            if cleaned_source.find(cleaned_question) != -1:
                return [answer["source_documents"][i]]
    return answer["source_documents"]


def update_conversation_history(conversation_name, question, answer):
    conversation = Conversation.objects.get(conversation_name=conversation_name)
    conversation.conversation_history += format_q_a(
        # sources for qa, source_documents for conversational retrieval chain
        answer["question"],
        answer["answer"],
        format_source(answer["source_documents"]),
    )
    conversation.save()
    return conversation.conversation_history


def format_q_a(question: str, answer: str, source: str):
    return [
        {"content": question, "direction": 1},
        {"content": answer, "direction": 0, "source": source},
    ]
