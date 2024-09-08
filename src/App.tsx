import { MouseEvent, useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL, fetchFile } from "@ffmpeg/util"
import "./App.css"

import FileListItem from "./components/FileListItem"

type importedVideo = {
  id: string
  file: File
  // selected: boolean
  transcodedURL: string | null
}
enum FileFormat {
  mkv = ".mkv",
  mp4 = ".mp4",
  webm = ".webm",
}
enum Resolution {
  fhd = "1080p",
  fourK = "4K",
}

enum Preset {
  ultrafast = "ultrafast",
  superfast = "superfast",
  veryfast = "veryfast",
  faster = "faster",
  fast = "fast",
  medium = "medium", // default preset
  slow = "slow",
  slower = "slower",
  veryslow = "veryslow",
  placebo = "placebo",
}
enum Profile {
  baseline = "baseline",
  main = "main",
  high = "high",
  high10 = "high10", // (first 10 bit compatible profile)
  high422 = "high422", // (supports yuv420p, yuv422p, yuv420p10le and yuv422p10le)
  high444 = "high444",
}
interface H264 {
  crf: number // 0-51
  preset: Preset
  profile: Profile
}
enum VideoCodec {
  h264 = "libx264",
  h265 = "libx265",
}
type transcodingSettings = {
  format: FileFormat
  resolution: Resolution
  framerate: number
  rotation: number
  videoCodec: VideoCodec
  videoCodecSettings: H264
}

function App() {
  const filePickerInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  // const [importedFiles, setImportedFiles] = useState<File[]>([])
  //
  //////////// NEW STATE ////////////////////
  // { id, File, selected, transcodedURL }
  const [importedVideos, setImportedVideos] = useState<importedVideo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<importedVideo[]>([])
  const [transcodingSettings, setTranscodingSettings] =
    useState<transcodingSettings>({
      format: FileFormat.mkv,
      resolution: Resolution.fhd,
      framerate: 30,
      rotation: 0,
      videoCodec: VideoCodec.h264,
      videoCodecSettings: {
        crf: 18,
        preset: Preset.medium,
        profile: Profile.baseline,
      },
    })
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
    ffmpeg.on("log", ({ message }) => {
      // if (messageRef.current) messageRef.current.innerHTML = message
      console.log(message)
    })
    // Listen to progress event instead of log.
    // ffmpeg.on("progress", ({ progress, time }) => {
    //   if (!messageRef.current) return
    //   messageRef.current.innerHTML = `${progress * 100} % (transcoded time: ${
    //     time / 1000000
    //   } s)`
    //   console.log(`${progress * 100} % (transcoded time: ${time / 1000000} s)`)
    // })
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
    console.log("ffmpeg-wasm loaded")
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
  // const transcodeSelected = async () => {
  //   try {
  //     console.log("transcode started")
  //     const videoURL = URL.createObjectURL(importedFiles[selectedFiles[0]]) // TEMPORARY, pick the first file // TODO: Add logic to handle the whole array of selected files
  //     const ffmpeg = ffmpegRef.current

  //     await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL))
  //     await ffmpeg.exec([
  //       "-i",
  //       "input.mp4",
  //       "-vf",
  //       "scale=-1:480",
  //       "output.mp4",
  //     ])

  //     const fileData = await ffmpeg.readFile("output.mp4")
  //     const data = new Uint8Array(fileData as ArrayBuffer)

  //     if (videoPlayerRef.current) {
  //       // const videoBlob = new Blob([data.buffer], { type: "video/mp4" })
  //       // const videoURL = URL.createObjectURL(videoBlob)
  //       // videoPlayerRef.current.src = videoURL

  //       // // Revoke the object URL after use
  //       // videoPlayerRef.current.onloadeddata = () => {
  //       //   URL.revokeObjectURL(videoURL)
  //       // }

  //       const downloadBlob = new Blob([data.buffer], { type: "video/mp4" })
  //       const downloadURL = URL.createObjectURL(downloadBlob)
  //       setDownloadLink(downloadURL)

  //       // Revoke the object URL after use
  //       URL.revokeObjectURL(downloadURL)
  //     }

  //     console.log("transcode complete")
  //   } catch (error) {
  //     console.error("Error during transcoding:", error)
  //   }
  // }
  const transcodeVideo = async () =>
    // importedVideo: importedVideo,
    // transcodingSettings: transcodingSettings
    {
      try {
        console.log("transcode started")
        const videoURL = URL.createObjectURL(importedVideos[0].file)
        const ffmpeg = ffmpegRef.current

        await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL))
        // ffmpeg -i input -c:v libx264 -preset slow -crf 22 -c:a copy output.mkv
        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-c:v",
          `${transcodingSettings.videoCodec}`,
          "-preset",
          `${transcodingSettings.videoCodecSettings.preset}`,
          "-crf",
          `${transcodingSettings.videoCodecSettings.crf}`,
          "-c:a", // copy audio tracks without encoding
          "copy",

          "-vf",
          "scale=-1:480",
          `output.mp4`,
        ])

        const fileData = await ffmpeg.readFile("output.mp4")
        const data = new Uint8Array(fileData as ArrayBuffer)

        // if (videoPlayerRef.current) {
        // const videoBlob = new Blob([data.buffer], { type: "video/mp4" })
        // const videoURL = URL.createObjectURL(videoBlob)
        // videoPlayerRef.current.src = videoURL

        // // Revoke the object URL after use
        // videoPlayerRef.current.onloadeddata = () => {
        //   URL.revokeObjectURL(videoURL)
        // }

        const downloadBlob = new Blob([data.buffer], { type: "video/mp4" })
        const downloadURL = URL.createObjectURL(downloadBlob)
        setDownloadLink(downloadURL)

        // Revoke the object URL after use
        URL.revokeObjectURL(downloadURL)
        // }

        console.log("transcode complete")
      } catch (error) {
        console.error("Error during transcoding:", error)
      }
    }

  //////////////////////////////////////////////////////
  /////////////////// ffmpeg ends //////////////////////
  //////////////////////////////////////////////////////

  function fileNameToId(fileName: string) {
    // Remove spaces and special characters using regular expressions
    return fileName.replace(/[\s~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g, "")
  }
  function onClickFilePickerButton() {
    if (filePickerInputRef.current) filePickerInputRef.current.click()
  }
  function addfileToImportedFiles(files: File[]) {
    if (!files) return
    const newImportedVideos = files.map((file) => {
      const newImportedVideo: importedVideo = {
        id: fileNameToId(file.name),
        file: file,
        // selected: false,
        transcodedURL: null,
      }
      return newImportedVideo
    })

    // setImportedFiles([...importedFiles, ...files])
    // setImportedFiles(newImportedVideos)
    setImportedVideos(newImportedVideos)
    // console.log(newImportedVideos)
    // console.log(filePickerInputRef.current?.value)
  }
  function handleDeleteFile(video: importedVideo) {
    setSelectedFiles((prevSelectedFiles) =>
      prevSelectedFiles.filter((vid) => vid.id != video.id)
    )
    setImportedVideos((prevVideos) =>
      prevVideos.filter((vid) => vid.id != video.id)
    )
  }
  function handleSelectFile(e: MouseEvent | null, video: importedVideo) {
    if (!e) return
    if (e.ctrlKey) {
      if (selectedFiles.some((vid) => vid.id == video.id)) {
        setSelectedFiles(selectedFiles.filter((vid) => vid.id != video.id))
      } else {
        setSelectedFiles([...selectedFiles, video])
      }
    } else {
      if (selectedFiles.some((vid) => vid.id == video.id)) {
        if (selectedFiles.length >= 2) {
          setSelectedFiles([video])
        } else {
          setSelectedFiles([])
        }
      } else {
        setSelectedFiles([video])
      }
      // if (selectedFiles.length == 0) {
      //   setSelectedFiles([fileIndex])
      // } else if (selectedFiles.length >= 1) {
      //   if (fileIndex == selectedFiles[0]) {
      //     setSelectedFiles([])
      //   } else {
      //     setSelectedFiles([fileIndex])
      //   }
      // }
    }
    // console.log(selectedFiles)
    // setImportedVideos((prevVideos) =>
    //   prevVideos.map((video, i) =>
    //     i === index ? { ...video, selected: !video.selected } : video
    //   )
    // )
  }
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
  // useEffect(() => {
  //   if (!videoPlayerRef.current) return
  //   if (selectedFiles.length > 0) {
  //     videoPlayerRef.current.src = URL.createObjectURL(
  //     )
  //     // importedVideos.some((video) => video.id == selectedFiles[selectedFiles.length - 1])
  //   }
  //   if (selectedFiles < 0) {
  //     videoPlayerRef.current.src = ""
  //   }
  // }, [selectedFiles])

  // logging
  useEffect(() => {
    console.log(importedVideos)
  }, [importedVideos])

  const fileList = importedVideos.map((video, index) => {
    return (
      <FileListItem
        key={video.id}
        index={index}
        fileName={video.file.name}
        handleDeleteFile={() => {
          handleDeleteFile(video)
        }}
        selected={selectedFiles.some((vid) => vid.id == video.id)}
        handleSelectFile={(e: MouseEvent | null) => {
          handleSelectFile(e, video)
        }}
      />
    )
  })
  return (
    <div className="app">
      {/* <div className="left half"> */}
      <div className="file-options">
        <input
          ref={filePickerInputRef}
          onChange={(event) => {
            if (!event.target.files) return
            addfileToImportedFiles([...event.target.files])
          }}
          type="file"
          id="select-files-input"
          multiple
        />
        <button id="select-files-button" onClick={onClickFilePickerButton}>
          Select files
        </button>
        <button
          // onClick={transcodeSelected}
          id="render-selected-button"
          disabled={!loaded}
        >
          Render Selected
        </button>
        <button
          id="render-all-button"
          onClick={transcodeVideo}
          disabled={!loaded}
        >
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
