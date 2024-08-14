import { useEffect, useRef, useState } from "react"
import "./App.css"

import FileListItem from "./components/FileListItem"

function App() {
  const filePickerInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  //   "Dummy 1",
  //   "Dummy 2",
  // ])
  function onClickFilePickerButton() {
    if (filePickerInputRef.current) filePickerInputRef.current.click()
  }
  function addfileToSelectedFiles(files: File[]) {
    if (!files) return
    setSelectedFiles([...selectedFiles, ...files])
    console.log(selectedFiles)
    // console.log(filePickerInputRef.current?.value)
  }
  function handleDeleteFile(fileName: string) {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name != fileName)
    )
  }

  const fileList = selectedFiles.map((file) => {
    return (
      <FileListItem
        key={file.name}
        fileName={file.name}
        onDeleteFile={() => handleDeleteFile(file.name)}
      />
    )
  })

  // logging
  useEffect(() => {
    console.log(selectedFiles)
  }, [selectedFiles])

  return (
    <div className="app">
      <div className="left half">
        <div className="file-picker-div">
          <input
            ref={filePickerInputRef}
            onChange={(event) => {
              if (!event.target.files) return
              addfileToSelectedFiles([...event.target.files])
            }}
            type="file"
            id="file-picker-input"
            multiple
          />
          <button
            className="file-picker"
            id="file-picker-button"
            onClick={onClickFilePickerButton}
          >
            Select files
          </button>
        </div>
        <div className="file-list-div">
          <ul className="file-list">
            <li>one</li>
            <li>two</li>
            {fileList}
          </ul>
        </div>
      </div>
      <div className="right half">
        <div className="player">
          <video src=""></video>
        </div>
      </div>
    </div>
  )
}

export default App
