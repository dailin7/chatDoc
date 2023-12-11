import { createSlice } from "@reduxjs/toolkit";

export interface filesState {
  value: Array<String>;
}

export const filesSlice = createSlice({
  name: "files",
  initialState: {
    value: Array(),
  },
  reducers: {
    loadFiles: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { loadFiles } = filesSlice.actions;

export default filesSlice.reducer;
