"use client";
import SidePanel from "./components/side_panel";
import TestInput from "./components/text_input";
import ChatHistory from "./components/chat_history";
import { Box } from "@mui/material";
import store from "./store/index";
import { Provider } from "react-redux";

export default function Home() {
  return (
    <Provider store={store}>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
        }}
      >
        <Box
          display="flex"
          sx={{
            height: "100%",
            width: "20%",
          }}
        >
          <SidePanel></SidePanel>
        </Box>

        <Box
          sx={{
            height: "100%",
            width: "80%",
          }}
        >
          <Box
            sx={{
              height: "90%",
              width: "100%",
            }}
          >
            <ChatHistory></ChatHistory>
          </Box>

          <Box
            display="flex"
            justifyContent="center"
            sx={{
              height: "10%",
              width: "100%",
            }}
          >
            <TestInput></TestInput>
          </Box>
        </Box>
      </Box>
    </Provider>
  );
}
