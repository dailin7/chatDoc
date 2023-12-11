import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DescriptionIcon from "@mui/icons-material/Description";
import { useSelector } from "react-redux";
import { rootState } from "../store/index";

export default function FileList() {
  const fileList = useSelector((state: rootState) => state.files.value);
  const filter = useSelector((state: rootState) => state.filter.value);

  let filtered_files = fileList.filter(function (file) {
    file = file.toLowerCase();
    return file.indexOf(filter) > -1;
  });

  return (
    <List>
      {filtered_files.map((filtered_file) => (
        <ListItem disablePadding>
          <ListItemButton>
            <DescriptionIcon></DescriptionIcon>
            <ListItemText primary={filtered_file}></ListItemText>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
