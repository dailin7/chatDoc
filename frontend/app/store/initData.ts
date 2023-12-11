import { createSlice } from "@reduxjs/toolkit";

export interface initDataState {
  title: string;
  files: Array<File>;
  disabled: boolean;
  fileNames: string[];
}

export const initDataSlice = createSlice({
  name: "initData",
  initialState: {
    title: "",
    files: [],
    disabled: true,
    fileNames: new Array<string>(),
  },
  reducers: {
    changeTitle: (state, action) => {
      state.title = action.payload;
      state.disabled = state.title.length == 0 || state.files.length == 0;
    },
    changeFiles: (state, action) => {
      state.files = action.payload;
      for (const file of action.payload) {
        state.fileNames.push(file.name);
      }
      state.disabled = state.title.length == 0 || state.files.length == 0;
    },
    reset: (state) => {
      state.files = [];
      state.title = "";
      state.disabled = true;
      state.fileNames = [];
    },
  },
});

export const { changeTitle, changeFiles, reset } = initDataSlice.actions;

export default initDataSlice.reducer;
