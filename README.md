# React-Audio-Visuals
> Made with create-react-library

Originally created by soniaboller:
https://soniaboller.github.io/audible-visuals/

[![NPM](https://img.shields.io/npm/v/react-audio-visuals.svg)](https://www.npmjs.com/package/react-audio-visuals) 

## Install

```bash
npm install --save react-audio-visuals
```

## Usage

You must set the ref on the audio sequentially before for rendering the Visualizer for now

```jsx
import React, { useRef } from 'react'
import Visualizer from 'react-audio-visuals'

const Example = () => {
  const audioRef = useRef(null)
    return (
      <>
        <audio src={"src"} ref={audioRef} controls />
        <Visualizer audioRef={audioRef} />
      </>
    )
  }
}
```

## License

MIT © [sharad-pizza-hut](https://github.com/sharad-pizza-hut)
