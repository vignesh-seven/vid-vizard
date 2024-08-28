import "./FileListItem.css"

export default function FileListItem(props: any) {
  return (
    <div
      className="file-list-item"
      style={props.selected == props.index ? { border: "5px solid blue" } : {}}
      // style={{ border: "5px solid blue" }}
    >
      <button
        style={props.selected == props.index ? { backgroundColor: "blue" } : {}}
        onClick={props.handleSelectFile}
        className="file-name"
      >
        {props.fileName}
      </button>
      <button
        style={props.selected == props.index ? { backgroundColor: "blue" } : {}}
        // onClick={props.handleDeleteFile}
        className="close"
      >
        X
      </button>
    </div>
  )
}
