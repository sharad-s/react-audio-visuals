# React-Audio-Visuals

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/test.svg)](https://www.npmjs.com/package/react-audio-visuals) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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
