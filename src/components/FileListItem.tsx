import "./FileListItem.css"

export default function FileListItem(props: any) {
  return (
    <div
      className="file-list-item"
      style={
        props.highlightedFile == props.index ? { border: "5px solid blue" } : {}
      }
      // style={{ border: "5px solid blue" }}
    >
      <button
        style={
          props.highlightedFile == props.index ? { fontWeight: "bold" } : {}
        }
        onClick={props.handleHighlightFile}
        className="file-name"
      >
        {props.fileName}
      </button>
      <button
        style={
          props.highlightedFile == props.index ? { fontWeight: "bold" } : {}
        }
        onClick={props.handleDeleteFile}
        className="close"
      >
        X
      </button>
    </div>
  )
}
