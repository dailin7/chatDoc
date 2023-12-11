import { createSlice } from "@reduxjs/toolkit";

export interface conversationState {
  selected: string;
  conList: Array<string>;
}

export const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    selected: "",
    conList: Array(),
  },
  reducers: {
    select: (state, action) => {
      state.selected = action.payload;
    },
    loadCons: (state, action) => {
      state.conList = action.payload;
    },
    loadDefaultCon: (state) => {
      state.selected = state.conList[0];
    },
  },
});

export const { select, loadCons, loadDefaultCon } = conversationSlice.actions;

export default conversationSlice.reducer;
