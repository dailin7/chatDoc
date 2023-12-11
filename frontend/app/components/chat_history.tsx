import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { ChatContainer, MessageList, Message, Avatar } from "@chatscope/chat-ui-kit-react";
import chatbot from "../assets/chatbot.png";
import { rootState } from "../store/index";
import Source from "../components/source";
import user from "../assets/user.png";
import { useSelector } from "react-redux";

export default function ChatHistory() {
  const messages = useSelector((state: rootState) => state.messages.value);

  return (
    <div style={{ height: "97%" }}>
      <ChatContainer>
        <MessageList>
          
          {/* display all messages from the selected conversation */}
          {messages.map((message) => (
            <Message
              model={{
                direction: message.direction,
                position: "single",
              }}
            >
              
              {message.direction == 0 ? (
                <Avatar src={chatbot.src}></Avatar>
              ) : (
                <Avatar src={user.src}></Avatar>
              )}

              <Message.CustomContent>
                {message.content}

                {/* only display source when the message is a answer and the source has length */}
                {message.direction == 0 && message.source.length > 0 ? (
                  <Source source={message.source}></Source>
                ) : (
                  <></>
                )}
              </Message.CustomContent>
            </Message>
          ))}
        </MessageList>
      </ChatContainer>
    </div>
  );
}
