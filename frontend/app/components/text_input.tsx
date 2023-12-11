import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useState } from "react";
import { chatMessage } from "../store/messages";
import { useDispatch, useSelector } from "react-redux";
import { add } from "../store/messages";
import { rootState } from "../store/index";

export default function TestInput() {
  //question from the user
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();
  const selectedCon = useSelector((state: rootState) => state.conversation.selected);

  //question entern field hidden if no conversation is selected
  if (selectedCon == "") {
    return <></>;
  }

  //handle "Enter" key as clicking the send question button
  function handleKeyDown(key) {
    if (key === "Enter") {
      sendQuery();
    }
  }

 /**
  * Send question to backend and retrieve the answer
  * Handle related data and UI changes
  */
  async function sendQuery() {
    //construct the query message and add it to chat history
    const queryMsg = { content: query, direction: 1 };
    dispatch(add(queryMsg));
    //display the loading prompt and disable question input field
    setQuery((query) => "Asking AI bot...");
    document.getElementById("query")?.setAttribute("disabled", "true");

    //generate response from backend
    let formData = new FormData();
    formData.append("question", query);
    const request = new Request(
      "http://127.0.0.1:8000/conversation/" + selectedCon + "/qa",
      {
        method: "POST",
        body: formData,
      }
    );

    //construct the answer message and add it to chat history
    const response = await (await fetch(request)).json();
    const responseMsg: chatMessage = {
      content: response.answer,
      direction: 0,
      source: response.source,
    };
    dispatch(add(responseMsg));

    //delete prompt and enabled input field
    setQuery((query) => "");
    document.getElementById("query")?.removeAttribute("disabled");
  }

  return (
    <TextField
      id="query"
      placeholder="type in your question"
      variant="outlined"
      multiline
      rows={1}
      sx={{
        width: "50vw",
      }}
      value={query}
      onChange={(event) => {
        setQuery(event.target.value);
      }}
      onKeyDown={(event) => {
        handleKeyDown(event.key);
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
          </InputAdornment>
        ),
      }}
    ></TextField>
  );
}
