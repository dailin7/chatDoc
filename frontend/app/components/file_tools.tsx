import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { update } from "../store/filter";
import { rootState } from "../store/index";
import { sendFiles } from "./form";
import { loadFiles } from "../store/files";

export default function FileTools() {
  const dispatch = useDispatch();
  const selectedCon = useSelector(
    (state: rootState) => state.conversation.selected
  );
  let oldFiles = useSelector((state: rootState) => state.files.value);

 /**
  * Get the updated files of the selected conversation
  * @param {string} conName Name of the selected conversation
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
  * Send user input files to backend knowledgebase if valid
  * Update the list of files of the seleced conversation
  * @param files list of input files to be sent to backend
  * @param oldFiles list of existing files of the selected conversation
  * @param selectedCon Name of the selected conversation
  */
  function handleUpdate(files, selectedCon) {
    sendFiles(files, selectedCon, oldFiles).then(() => getFiles(selectedCon));
  }

  return (
    <>
      <TextField
        sx={{
          width: "12.5vw",
        }}
        label="search file"
        variant="outlined"
        onChange={(event) => {
          dispatch(update(event.target.value));
        }}
      ></TextField>

      <Button
        sx={{
          left: "1vw",
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
          onChange={(event) => handleUpdate(event.target.files, selectedCon)}
        ></input>
      </Button>
    </>
  );
}
