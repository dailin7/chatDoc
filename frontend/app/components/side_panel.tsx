import * as React from "react";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import FileTools from "./file_tools";
import FileList from "./file_list";
import Selector from "./selector";
import { useDispatch } from "react-redux";
import { loadCons } from "../store/conversation";

export default function PermanentDrawerLeft() {
  const dispatch = useDispatch();

 /**
  * Retrieve and update conversations
  */
  async function getCons() {
    const request = new Request("http://127.0.0.1:8000/collection/names", {
      method: "GET",
    });
    const conversationList = await (await fetch(request)).json();
    dispatch(loadCons(conversationList));
  }

  //get the updated list of conversations for the side panel
  getCons();

  return (
    <Drawer
      PaperProps={{
        sx: {
          width: "20vw",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box margin="1vw" width="18vw">
        <Selector></Selector>
      </Box>

      <Box display="flex" margin="1vw" width="18vw">
        <FileTools></FileTools>
      </Box>

      <Divider />

      <Box overflow="scroll">
        <FileList></FileList>
      </Box>
    </Drawer>
  );
}
