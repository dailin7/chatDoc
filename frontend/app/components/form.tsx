import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import MenuItem from "@mui/material/MenuItem";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { rootState } from "../store/index";
import { useDispatch, useSelector } from "react-redux";
import { changeFiles, changeTitle, reset } from "../store/initData";
import { loadCons } from "../store/conversation";

/**
 * Send user input files to backend knowledge base
 * @param files user input files
 * @param conName the selected conversation to be updated
 * @param oldFiles existing files of the conversation
 */
export async function sendFiles(files, conName, oldFiles) {
  files = Array.from(files);
  let formData = new FormData();
  //check if uploading existing file
  files.map((file) => {
    if (oldFiles.indexOf(file.name) > -1) {
      alert("cannnot upload duplicate files of " + file.name);
      return;
    } else {
      formData.append("files", file);
    }
  });

  //upload valid files
  const request = new Request(
    "http://127.0.0.1:8000/collection/" + conName + "/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const response = await fetch(request);
  if (response.status != 200) {
    alert("error processing files");
    return;
  }
}

export default function FormDialog() {
  const [open, setOpen] = React.useState(false);
  let disabled = useSelector((state: rootState) => state.initData.disabled);
  let title = useSelector((state: rootState) => state.initData.title);
  let files = useSelector((state: rootState) => state.initData.files);
  let fileNames = useSelector((state: rootState) => state.initData.fileNames);
  const dispatch = useDispatch();

 /**
  * Create a new conversation(knowledge base in backend)
  */
  async function createCon() {
    let formData = new FormData();
    formData.append("conversation_name", title);

    //create backend conversation
    const ConRequest = new Request(
      "http://127.0.0.1:8000/conversation/create",
      {
        method: "POST",
        body: formData,
      }
    );
    const ConResponse = await fetch(ConRequest);
    if (ConResponse.status != 201) {
      alert("error createing the conversation");
      return;
    }

    //activate the new conversation
    const getConRequest = new Request(
      "http://127.0.0.1:8000/conversation/" + title,
      {
        method: "GET",
      }
    );
    const getConResponse = await fetch(getConRequest);
    if (getConResponse.status != 200) {
      alert("error accessing the conversation");
      return;
    }

    //send init_documents to the conversation
    sendFiles(files, title, []);
    getCons();
  }

 /**
  * Get the updated list of conversations
  */
  async function getCons() {
    const request = new Request("http://127.0.0.1:8000/collection/names", {
      method: "GET",
    });
    const conversationList = await (await fetch(request)).json();
    dispatch(loadCons(conversationList));
  }

  function handleCreate() {
    createCon();

    //reset and close the form
    dispatch(reset());
    setOpen(false);
  }

  function handleCancel() {
    //reset and close the form
    setOpen(false);
    dispatch(reset());
  }

  return (
    <div>
      <MenuItem
        onClick={() => {
          setOpen(true);
        }}
      >
        Create New Conversation
      </MenuItem>
      <Dialog open={open}>
        <DialogContent>
          <DialogContentText>
            To open a new conversation, please enter the title below and upload
            files.
          </DialogContentText>
          <TextField
            margin="dense"
            id="name"
            label="Title"
            fullWidth
            variant="outlined"
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
            onChange={(event) => {
              dispatch(changeTitle(event.target.value));
            }}
          />
          <Button
            sx={{
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
            variant="contained"
            component="label"
          >
            <FileUploadIcon></FileUploadIcon>
            <input
              id="uploader"
              accept=".pdf,.docx,.txt"
              multiple
              type="file"
              hidden
              onChange={(event) => {
                dispatch(changeFiles(event.target.files));
              }}
            ></input>
          </Button>
          <ul>
            {fileNames.map((name) => (
              <li>{name}</li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleCreate} disabled={disabled}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
