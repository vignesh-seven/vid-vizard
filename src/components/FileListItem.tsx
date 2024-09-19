import { useRef } from "react"
import "./FileListItem.css"

export default function FileListItem(props: any) {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
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
      {props.transcodedURL ? (
        <>
          <button
            style={props.selected ? { backgroundColor: "blue" } : {}}
            onClick={() => {
              downloadLinkRef.current?.click()
            }}
            className="download"
          >
            ⬇️
          </button>
          <a
            href={props.transcodedURL}
            download={props.name}
            ref={downloadLinkRef}
          >
            Download
          </a>
        </>
      ) : (
        <></>
      )}
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
