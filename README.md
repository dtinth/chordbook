# dtinth’s interactive chordbook

A simple interactive chordbook library web application.

## Philosophy

- No build tools needed.

## Creating a chordsheet

Create an HTML file with this template:

```html
<!DOCTYPE html>
<meta charset="utf-8" />
<script src="lib/entry.js"></script>
<pre id="src">
[CHORDSHEET DATA HERE]
</pre>
```

## Chordsheet syntax

A chordsheet is a simple line-based text file format.
Each line can either be a directive or a row that appears in the formatted chordsheet.

For ease of transcribing,
the chords are expressed in terms of **scale degree**.
That is, instead of using an absolute note names, we use numbers representing the scale degree instead.

For example, in a song with the key of C major, these diatonic chords can be represented as scale degrees as follows:

| C | Dm | Em | F | G | Am | Bdim |
| --- | --- | --- | --- | --- | --- | --- |
| `1` | `2m` | `3m` | `4` | `5` | `6m` | `7dim` |

Another example: in a song with the key of E major, these diatonic chords can be represented as scale degrees as follows:

| E | F#m | G#m | A | B | C#m | D#dim |
| --- | --- | --- | --- | --- | --- | --- |
| `1` | `2m` | `3m` | `4` | `5` | `6m` | `7dim` |

You can see that we use the same symbol for each chord having the same scale degree, regardless of the key it is in.

Accidentals can be added **before** the number.
That is, in a song with key of E major, the chord **Dmaj7** can written as `b7maj7`.

### Directives

- **`scale <Note> <Scale>`** declares the scale to be used.
  This affects the chords written after it.
  It may be used multiple times in case the song contains a key change.

  ```
  scale E major
  ```

- **`youtube <ID>`** specifies the YouTube video ID.
  A YouTube embed will appear at the top right corner of the screen,
  and the chords will be synchronized with the video.

  ```
  youtube KEqiqYXuaj8
  ```

- **`offset <T>`** specifies the time, in seconds, at which the first chord starts.
  This directive must be used before any chord is written.

- **`title <Title>`** specifies the song title.

### Lyrics row

Lines that start with a semicolon (`;`) followed by a space are considered a lyrics line.
The lyrics text will be displayed on the screen.

```
;
```

### Chord row


