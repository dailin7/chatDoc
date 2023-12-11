from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..serializers import ConversationSerializer
from ..models.models import Conversation
from ..utils import load_chain, format_answer, single_source_qa
from ..sources import qa
from ..service.conversation import (
    create_conversation as createConversation,
    update_conversation_history,
    find_answer,
)
from ..service.collection import create_collection, delete_collection
import uuid


@api_view(["POST"])
def create_conversation(request):
    try:
        res = createConversation(request.data)
        name = request.data["conversation_name"]
        create_collection(name)
        return Response(res, status=status.HTTP_201_CREATED)
    except:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_conversations_by_user_id(request):
    try:
        user_id = uuid.UUID(request.GET["user_id"])
        conversations = Conversation.objects.filter(user_id=user_id)
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_conversations(request):
    try:
        conversations = Conversation.objects.all()
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_conversation(request, conversation_name: str):
    # try:
    conversation = Conversation.objects.get(conversation_name=conversation_name)
    # Load qa chain
    qa[conversation_name] = load_chain(
        collection_name=conversation_name, model_name="gpt-3.5-turbo-16k"
    )
    serializer = ConversationSerializer(conversation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def get_answer(request, conversation_name: str):
    res = qa[conversation_name](
        {
            "question": request.data["question"],
            "chat_history": [],
        }
    )

    temp = find_answer(request.data["question"], res)
    if len(temp) == 1:
        # generate answer from the only source using llm and update the 'answer' and 'source' field of res
        singe_res = single_source_qa(request.data["question"], temp[0].page_content)
        res["answer"] = singe_res
        res["source_documents"] = temp

    # save q & a to db
    update_conversation_history(conversation_name, request.data["question"], res)
    return Response(format_answer(res), status=status.HTTP_200_OK)


@api_view(["DELETE"])
def delete_conversation(request, conversation_name: str):
    conversation = Conversation.objects.get(conversation_name=conversation_name)
    conversation.delete()
    delete_collection(collection_name=conversation_name)
    return Response(status=status.HTTP_200_OK)
