import React, { useRef, Fragment } from "react";
import Spiral from "react-audio-visuals"
import AudioPlayer from "./components/AudioPlayer";

const BW = "B";

const styles = {
  wrapper: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
    position: "absolute",
    backgroundColor: BW === "B" ? "black" : "white",
  },
  text: {
    color: BW === "B" ? "white" : "black",
  },
};

const App = () => {
  const audioRef = useRef(null);
  return (
    <Fragment>
      <AudioPlayer ref={audioRef} />
      <div style={styles.wrapper}>
        <Spiral audioRef={audioRef} animateOnStart={true} />
      </div>
    </Fragment>
  );
};

export default App;
