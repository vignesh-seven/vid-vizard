import { useEffect, useRef, useState } from "react"
import "./App.css"

import FileListItem from "./components/FileListItem"

function App() {
  const filePickerInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [highlightedFile, setHighlightedFile] = useState(-1)
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
  function handleDeleteFile(fileName: string, index: number) {
    if (highlightedFile == index) {
      handleHighlightFile(-1)
    }
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name != fileName)
    )
  }
  function handleHighlightFile(fileIndex: number) {
    setHighlightedFile(fileIndex)
  }
  const fileList = selectedFiles.map((file, index) => {
    return (
      <FileListItem
        key={file.name}
        index={index}
        fileName={file.name}
        handleDeleteFile={() => {
          handleDeleteFile(file.name, index)
        }}
        highlightedFile={highlightedFile}
        handleHighlightFile={() => {
          handleHighlightFile(index)
        }}
      />
    )
  })
  useEffect(() => {
    if (!videoPlayerRef.current) return
    if (highlightedFile >= 0) {
      videoPlayerRef.current.src = URL.createObjectURL(
        selectedFiles[highlightedFile]
      )
    }
    if (highlightedFile < 0) {
      videoPlayerRef.current.src = ""
    }
  }, [highlightedFile])

  // logging
  useEffect(() => {
    console.log(selectedFiles)
  }, [selectedFiles])

  return (
    <div className="app">
      {/* <div className="left half"> */}
      <div className="file-options">
        <input
          ref={filePickerInputRef}
          onChange={(event) => {
            if (!event.target.files) return
            addfileToSelectedFiles([...event.target.files])
          }}
          type="file"
          id="select-files-input"
          multiple
        />
        <button id="select-files-button" onClick={onClickFilePickerButton}>
          Select files
        </button>
        <button id="render-selected-button">Render Selected</button>
        <button id="render-all-button">Render All</button>
      </div>
      <div className="video-preview">
        <video controls ref={videoPlayerRef}></video>
      </div>
      <div className="options">
        <button>Preset</button>
        <button>Format</button>
        <button>Resolution</button>
        <button>Framerate</button>
        <button>Rotation</button>
        <button>Crop</button>
        <button>Video Settings</button>
        <button>Audio Settings</button>
        <button>Subtitle Settings</button>
      </div>
      <div className="files-list">
        {/* <ul>
          <li>one</li>
          <li>two</li> */}
        {fileList}
        {/* </ul> */}
      </div>
      {/* </div> */}
      {/* <div className="right half"> */}
      {/* </div> */}
    </div>
  )
}

export default App
