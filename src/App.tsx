import { MouseEvent, useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL, fetchFile } from "@ffmpeg/util"
import "./App.css"

import FileListItem from "./components/FileListItem"

type importedVideo = {
  id: string
  file: File
  // selected: boolean
  originalURL: string
  transcodedURL: string | null
}
enum FileFormat {
  same = "Same as source",
  mkv = ".mkv",
  mp4 = ".mp4",
  webm = ".webm",
}
enum Resolution {
  fHD = "1080p",
  fourK = "4K",
}
const fps = {
  same: "Same as source",
  ntsc: `${Math.round((30000 / 1001) * 1000) / 1000}`,
  pal: `${25}`,
  film: `${24}`,
  ntsc_film: `${Math.round((24000 / 1001) * 1000) / 1000}`,
}
// enum Framerate {
//   same = "Same as source",
//   ntsc = "ntsc",
//   pal = "pal",
//   film = "film",
//   ntsc_film = "ntsc_film",
// }

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
interface Crop {
  left: number
  right: number
  top: number
  bottom: 0
}
enum VideoCodec {
  h264 = "libx264",
  h265 = "libx265",
}
type transcodingSettings = {
  format: FileFormat
  resolution: Resolution
  framerate: string
  rotation: number
  crop: Crop
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
      resolution: Resolution.fHD,
      framerate: "30",
      rotation: 0,
      crop: { left: 0, right: 0, top: 0, bottom: 0 },
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
    // ffmpeg.on("log", ({ message }) => {
    //   if (messageRef.current) messageRef.current.innerHTML = message
    //   // console.log(message)
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
  async function transcodeVideo(
    videoFile: importedVideo,
    videoTranscodingSettings: transcodingSettings
  ) {
    // importedVideo: importedVideo,
    // transcodingSettings: transcodingSettings
    // if (videoFiles.length == 0) return console.log("No files in videoFiles")
    // for (const videoFile of videoFiles) {
    try {
      // console.log(`transcode started for: ${videoFile.file.name}`)
      const videoURL = URL.createObjectURL(videoFile.file)
      const ffmpeg = ffmpegRef.current
      const fileExtension = videoFile.file.name.split(".").at(-1)
      const inputFileName = `${videoFile.id}.${fileExtension}`
      const outputFileName = `${videoFile.id}_transcoded.${fileExtension}`
      console.log([videoURL, ffmpeg, fileExtension, inputFileName])

      await ffmpeg.writeFile(inputFileName, await fetchFile(videoURL))
      // ffmpeg -i input -c:v libx264 -preset slow -crf 22 -c:a copy output.mkv

      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-vf",
        "scale=-1:480",
        outputFileName,
      ])

      const fileData = await ffmpeg.readFile(outputFileName)
      const data = new Uint8Array(fileData as ArrayBuffer)

      const downloadBlob = new Blob([data.buffer], { type: "video/mp4" })
      const downloadURL = URL.createObjectURL(downloadBlob)
      console.log("transcode complete")
      return downloadURL
      return null

      // preparing the ffmpeg command
      const outputFileExtension = () => {
        switch (videoTranscodingSettings.format) {
          case FileFormat.mkv:
            return "mkv"
          case FileFormat.mp4:
            return "mp4"
          case FileFormat.webm:
            return "webm"
          default:
            return fileExtension
        }
      }
      const outputResolution = () => {
        switch (videoTranscodingSettings.resolution) {
          case Resolution.fHD:
            return "-vf scale=1920:-1"
          case Resolution.fourK:
            return "-vf scale=3840:-1"
          default:
            return ""
        }
      }
      const outputFramerate = () => {
        switch (videoTranscodingSettings.framerate) {
          case fps.film:
            return `-vf fps=film`
          case fps.ntsc:
            return `-vf fps=ntsc`
          case fps.ntsc_film:
            return `-vf fps=ntsc_film`
          case fps.pal:
            return `-vf fps=pal`
          default:
            return ""
        }
      }

      await ffmpeg.exec([
        "-i",
        `${videoFile.id}`,
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

      // const fileData = await ffmpeg.readFile("output.mp4")
      // const data = new Uint8Array(fileData as ArrayBuffer)

      // if (videoPlayerRef.current) {
      // const videoBlob = new Blob([data.buffer], { type: "video/mp4" })
      // const videoURL = URL.createObjectURL(videoBlob)
      // videoPlayerRef.current.src = videoURL

      // // Revoke the object URL after use
      // videoPlayerRef.current.onloadeddata = () => {
      //   URL.revokeObjectURL(videoURL)
      // }

      // const downloadBlob = new Blob([data.buffer], { type: "video/mp4" })
      // const downloadURL = URL.createObjectURL(downloadBlob)
      // console.log("transcode complete")
      // return downloadURL

      // Revoke the object URL after use
      // URL.revokeObjectURL(downloadURL)
      // }
    } catch (error) {
      console.error("Error during transcoding:", error)
      return null
    }
    // }
  }
  async function transcodeSelectedVideos(videos: importedVideo[]) {
    // console.log(selectedFiles)
    for (const video of videos) {
      const transcodedVideoURL = await transcodeVideo(
        video,
        transcodingSettings
      )
      setImportedVideos((prevImportedVideos) => {
        return prevImportedVideos.map((oldVideo) => {
          if (oldVideo.id == video.id) {
            if (transcodedVideoURL && videoPlayerRef.current) {
              videoPlayerRef.current.src = transcodedVideoURL
            }
            return {
              ...oldVideo,
              transcodedURL: transcodedVideoURL,
            }
            // return newVideo
          } else {
            return oldVideo
          }
        })
      })
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
      const originalURL = URL.createObjectURL(file)
      const newImportedVideo: importedVideo = {
        id: fileNameToId(file.name),
        file: file,
        // selected: false,
        originalURL: originalURL,
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
  function handleTranscodingSettings(event: any) {
    // console.log(event.target.name)
    // console.log(event.target.value)
    // let updatedSetting = event.target.name
    let updatedValue = event.target.value
    // let updatedID = event.target.id
    // console.log(updatedID)
    setTranscodingSettings((prevTranscodingSetings) => {
      if (event.target.name == "crop") {
        switch (event.target.id) {
          case "crop-left":
            updatedValue = {
              ...transcodingSettings.crop,
              left: updatedValue,
            }
            break
          case "crop-right":
            updatedValue = {
              ...transcodingSettings.crop,
              right: updatedValue,
            }
            break
          case "crop-top":
            updatedValue = {
              ...transcodingSettings.crop,
              top: updatedValue,
            }
            break
          case "crop-bottom":
            updatedValue = {
              ...transcodingSettings.crop,
              bottom: updatedValue,
            }
            break

          default:
            break
        }
      }
      return {
        ...prevTranscodingSetings,
        [event.target.name]: updatedValue,
      }
    })
  }
  // useEffect(() => {
  //   console.log(transcodingSettings)
  // }, [transcodingSettings])

  const ffmpegStatus = loaded ? (
    <>
      <button>Loaded</button>
      <p ref={messageRef}></p>
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
  // useEffect(() => {
  //   console.log(importedVideos)
  // }, [importedVideos])

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
        transcodedURL={video.transcodedURL}
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
          onClick={() => transcodeSelectedVideos(selectedFiles)}
          id="render-selected-button"
          disabled={!loaded}
        >
          Render Selected
        </button>
        <button
          id="render-all-button"
          // onClick={transcodeVideo}
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
        <form onChange={handleTranscodingSettings}>
          <h4>Preset</h4>
          <h4>Format</h4>
          <select name="format" id="format">
            {Object.entries(FileFormat).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
            {/* <option value="same">Same as source</option>
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="webm">WebM</option> */}
          </select>
          <h4>Resolution</h4>
          <select name="max-resolution" id="max-resolution">
            {Object.entries(Resolution).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
            {/* <option value="same">Same as source</option>
            <option value="4k">4K</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option> */}
          </select>
          <h4>Framerate</h4>
          <select name="framerate" id="framerate">
            {Object.entries(fps).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
            {/* <option value="same">Same as source</option>
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="25">25</option> */}
          </select>
          <h4>Rotation</h4>
          <select name="rotation" id="rotation">
            <option value="same">None</option>
            <option value="90">90</option>
            <option value="180">180</option>
            <option value="270">270</option>
            <option value="custom">Custom</option>
            {/* {transcodingSettings.rotation.} */}
          </select>
          <h4>Crop</h4>
          <div id="crop">
            <label htmlFor="crop-left">Left</label>
            <input
              type="number"
              name="crop"
              id="crop-left"
              defaultValue={transcodingSettings.crop.left}
            />
            <br></br>
            <label htmlFor="crop-right">Right</label>
            <input
              type="number"
              name="crop"
              id="crop-right"
              defaultValue={transcodingSettings.crop.right}
            />
            <br></br>
            <label htmlFor="crop-top">Top</label>
            <input
              type="number"
              name="crop"
              id="crop-top"
              defaultValue={transcodingSettings.crop.top}
            />
            <br></br>
            <label htmlFor="crop-bottom">Bottom</label>
            <input
              type="number"
              name="crop"
              id="crop-bottom"
              defaultValue={transcodingSettings.crop.left}
            />
            <br></br>
          </div>
          <h4>Video Settings</h4>
          <label htmlFor="codec">Codec</label>
          <select name="codec" id="codec">
            <option value={VideoCodec.h264}>H.264</option>
            <option value={VideoCodec.h265}>H.265</option>
          </select>
          <label htmlFor="preset">Preset</label>
          <select name="preset" id="preset">
            {Object.entries(Preset).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
          </select>
          <label htmlFor="profile">Profile</label>
          <select name="profile" id="profile">
            {Object.entries(Profile).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
          </select>
          <h4>Audio Settings</h4>
          <h4>Subtitle Settings</h4>
        </form>
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
