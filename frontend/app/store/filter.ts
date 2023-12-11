import { createSlice } from "@reduxjs/toolkit";

export interface filterState {
  value: string;
}

export const filterSlice = createSlice({
  name: "filter",
  initialState: {
    value: "",
  },
  reducers: {
    update: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { update } = filterSlice.actions;

export default filterSlice.reducer;
