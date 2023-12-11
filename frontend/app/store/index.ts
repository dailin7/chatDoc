import { configureStore } from "@reduxjs/toolkit";
import filterReducer from "./filter";
import { filterState } from "./filter";
import messagesReducer from "./messages";
import { messagesState } from "./messages";
import conversationReducer from "./conversation";
import { conversationState } from "./conversation";
import filesReducer from "./files";
import { filesState } from "./files";
import initDataReducer from "./initData";
import { initDataState } from "./initData";

export interface rootState {
  filter: filterState;
  messages: messagesState;
  conversation: conversationState;
  files: filesState;
  initData: initDataState;
}

export default configureStore({
  reducer: {
    filter: filterReducer,
    messages: messagesReducer,
    conversation: conversationReducer,
    files: filesReducer,
    initData: initDataReducer,
  },
});
