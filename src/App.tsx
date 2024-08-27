import { useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL, fetchFile } from "@ffmpeg/util"
import "./App.css"

import FileListItem from "./components/FileListItem"

function App() {
  const filePickerInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [highlightedFile, setHighlightedFile] = useState(-1)

  //////////////////////////////////////////////////////
  ////////////////////// ffmpeg ////////////////////////
  //////////////////////////////////////////////////////
  const [loaded, setLoaded] = useState(false)
  const ffmpegRef = useRef(new FFmpeg())
  // const videoPlayerRef = useRef<HTMLVideoElement | null>(null)
  const messageRef = useRef<HTMLParagraphElement | null>(null)
  const [downloadLink, setDownloadLink] = useState<string>("")
  const load = async () => {
    // const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"

    const ffmpeg = ffmpegRef.current
    // ffmpeg.on("log", ({ message }) => {
    //   if (messageRef.current) messageRef.current.innerHTML = message
    // })
    // Listen to progress event instead of log.
    ffmpeg.on("progress", ({ progress, time }) => {
      if (!messageRef.current) return
      messageRef.current.innerHTML = `${progress * 100} % (transcoded time: ${
        time / 1000000
      } s)`
      console.log(`${progress * 100} % (transcoded time: ${time / 1000000} s)`)
    })
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    })
    setLoaded(true)
    // console.log({ loaded })
  }

  // const transcode = async () => {
  //   const videoURL =
  //     "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi"
  //   const ffmpeg = ffmpegRef.current
  //   await ffmpeg.writeFile("input.avi", await fetchFile(videoURL))
  //   await ffmpeg.exec(["-i", "input.avi", "output.mp4"])
  //   const fileData = await ffmpeg.readFile("output.mp4")
  //   const data = new Uint8Array(fileData as ArrayBuffer)
  //   if (videoPlayerRef.current) {
  //     videoPlayerRef.current.src = URL.createObjectURL(
  //       new Blob([data.buffer], { type: "video/mp4" })
  //     )
  //     const linkToNewVideoFile = URL.createObjectURL(
  //       new Blob([data.buffer], { type: "video/mp4" })
  //     )
  //     setDownloadLink(linkToNewVideoFile.toString())
  //   }
  // }
  const transcodeSelected = async () => {
    try {
      console.log("transcode started")
      const videoURL = URL.createObjectURL(selectedFiles[highlightedFile])
      const ffmpeg = ffmpegRef.current

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL))
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        "scale=-1:480",
        "output.mp4",
      ])

      const fileData = await ffmpeg.readFile("output.mp4")
      const data = new Uint8Array(fileData as ArrayBuffer)

      if (videoPlayerRef.current) {
        const videoBlob = new Blob([data.buffer], { type: "video/mp4" })
        const videoURL = URL.createObjectURL(videoBlob)
        videoPlayerRef.current.src = videoURL

        // Revoke the object URL after use
        videoPlayerRef.current.onloadeddata = () => {
          URL.revokeObjectURL(videoURL)
        }

        const downloadBlob = new Blob([data.buffer], { type: "video/mp4" })
        const downloadURL = URL.createObjectURL(downloadBlob)
        setDownloadLink(downloadURL)

        // Revoke the object URL after use
        URL.revokeObjectURL(downloadURL)
      }

      console.log("transcode complete")
    } catch (error) {
      console.error("Error during transcoding:", error)
    }
  }

  //////////////////////////////////////////////////////
  /////////////////// ffmpeg ends //////////////////////
  //////////////////////////////////////////////////////

  function onClickFilePickerButton() {
    if (filePickerInputRef.current) filePickerInputRef.current.click()
  }
  function addfileToSelectedFiles(files: File[]) {
    if (!files) return
    const newSelectedFiles = selectedFiles.concat(
      // this is to eliminate duplicates
      files.filter(
        (item2) => !selectedFiles.some((item1) => item1.name === item2.name)
      )
    )
    // setSelectedFiles([...selectedFiles, ...files])
    setSelectedFiles(newSelectedFiles)
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
  const ffmpegStatus = loaded ? (
    <>
      <p ref={messageRef}></p>
      <button>Loaded</button>
    </>
  ) : (
    <button onClick={load}>Loading ffmpeg</button>
  )
  useEffect(() => {
    try {
      load()
    } catch (err) {
      console.log("Error loading ffmpeg")
      console.log(err)
    }
  }, [])
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
        <button
          onClick={transcodeSelected}
          id="render-selected-button"
          disabled={!loaded}
        >
          Render Selected
        </button>
        <button id="render-all-button" disabled={!loaded}>
          Render All
        </button>
        {ffmpegStatus}
        <a href={downloadLink} download="output.mp4">
          Download
        </a>
      </div>
      <div className="video-preview">
        <video controls ref={videoPlayerRef}></video>
      </div>
      <div className="options">
        <h4>Preset</h4>
        <h4>Format</h4>
        <select name="format" id="format">
          <option value="same-as-source">Same as source</option>
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
        </select>
        <h4>Resolution</h4>
        <select name="max-resolution" id="max-resolution">
          <option value="same-as-source">Same as source</option>
          <option value="4k">4K</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
        </select>
        <h4>Framerate</h4>
        <select name="framerate" id="framerate">
          <option value="same-as-source">Same as source</option>
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="25">25</option>
        </select>
        <h4>Rotation</h4>
        <h4>Crop</h4>
        <h4>Video Settings</h4>
        <h4>Audio Settings</h4>
        <h4>Subtitle Settings</h4>
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
