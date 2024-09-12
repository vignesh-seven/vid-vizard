import "./FileListItem.css"

export default function FileListItem(props: any) {
  return (
    <div
      className="file-list-item"
      style={props.selected ? { backgroundColor: "blue" } : {}}
      // style={{ border: "5px solid blue" }}
    >
      <img
        src="./thumbnail.png"
        alt="thumbnail"
        onClick={props.handleSelectFile}
      />

      <button
        style={props.selected ? { backgroundColor: "blue" } : {}}
        onClick={props.handleSelectFile}
        className="file-name"
      >
        {props.fileName}
      </button>
      <button
        style={props.selected ? { backgroundColor: "blue" } : {}}
        // onClick={}
        className="download"
      >
        ⬇️
      </button>
      <button
        style={props.selected ? { backgroundColor: "blue" } : {}}
        onClick={props.handleDeleteFile}
        className="close"
      >
        ❌
      </button>
    </div>
  )
}
