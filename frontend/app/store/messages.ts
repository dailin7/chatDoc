import { createSlice } from "@reduxjs/toolkit";

export interface chatMessage {
  content: string;
  direction: number;
  source: string;
}

export interface messagesState {
  value: Array<chatMessage>;
}

export const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    value: Array(),
  },
  reducers: {
    add: (state, action) => {
      state.value = [...state.value, action.payload];
    },
    loadMsg: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { add, loadMsg } = messagesSlice.actions;

export default messagesSlice.reducer;
