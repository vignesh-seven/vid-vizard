import "./FileListItem.css"

export default function FileListItem(props: any) {
  return (
    <div className="file-list-item">
      <button className="file-name">{props.fileName}</button>
      <button onClick={props.onDeleteFile} className="close">
        X
      </button>
    </div>
  )
}
