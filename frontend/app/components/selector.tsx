import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import ClearIcon from "@mui/icons-material/Clear";
import { TextField } from "@mui/material";
import { rootState } from "../store/index";
import { useDispatch, useSelector } from "react-redux";
import FormDialog from "./form";
import { loadCons, select } from "../store/conversation";
import { loadFiles } from "../store/files";
import { loadMsg } from "../store/messages";

export default function Selector() {
  const conversationList = useSelector(
    (state: rootState) => state.conversation.conList
  );
  const selectedCon = useSelector(
    (state: rootState) => state.conversation.selected
  );
  const dispatch = useDispatch();

 /**
  * Delete the selected conversation
  * Get the updated list of conversations
  * @param conName the selected conversation
  */
  async function deleteCon(conName) {
    const deleteRequest = new Request(
      "http://127.0.0.1:8000/conversation/delete/" + conName,
      {
        method: "DELETE",
      }
    );
    const deleteResponse = await fetch(deleteRequest);
    if (deleteResponse.status != 200) {
      alert("error deleting the conversation of " + conName);
      return;
    }
    getCons();
  }

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

 /**
  * Retrieve and update the list of files for selected conversation
  */
  async function getFiles(conName) {
    const request = new Request(
      "http://127.0.0.1:8000/db_collection/get/" + conName,
      {
        method: "GET",
      }
    );
    const fileList = await (await fetch(request)).json();
    dispatch(loadFiles(fileList.files));
  }

 /**
  * Retrieve and update the list of messages for selected conversation
  */
  async function getChatHistory(conName) {
    const request = new Request(
      "http://127.0.0.1:8000/conversation/" + conName,
      {
        method: "GET",
      }
    );
    const msgList = await (await fetch(request)).json();
    dispatch(loadMsg(msgList.conversation_history));
  }

  function handleItemClick(e, conName) {
    //prevent changing conversation from clicking the delete icon or same conversation
    if (e.target.id != "icon" && conName != selectedCon) {
      dispatch(select(conName));
      getFiles(conName);
      getChatHistory(conName);
    }
  }

  return (
    <div>
      <TextField
        sx={{
          width: "18vw",
        }}
        label="Conversation"
        value={selectedCon}
        defaultValue={conversationList[0]}
        select
      >
        <FormDialog></FormDialog>
        {conversationList.map((con) => (
          <MenuItem
            value={con}
            sx={{
              display: "flex",
              justifyContent: "space-between",
            }}
            onClick={(event) => handleItemClick(event, con)}
          >
            {con}
            {con == selectedCon ? (
              ""
            ) : (
              <ClearIcon
                id="icon"
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                  },
                  marginRight: "0.5vw",
                  marginTop: "0.2vh",
                }}
                onClick={() => deleteCon(con)}
              ></ClearIcon>
            )}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}
