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

### Section row

Lines that have only one token that ends with a colon (`:`) denote a section.
They can be used to separate different sections of a song from each other.

```
Chorus:
```

### Lyrics row

Lines that start with a semicolon (`;`) followed by a space are considered a lyrics line.
The lyrics text will be displayed on the screen.

```
; ฉัน— ฉันนั้นโชคดีเหลือเกิน
```

### Chord row

Lines that are not directives and lyrics row are considered to be a row of chord blocks.
Chords will appear as blocks.
In general, each block corresponds to the same unit of musical time (usually a quarter note or a half note, depending on the song’s complexity).
Each token in this line is separated by a space.

- **`<chord>`** Adds a chord block to this row.
  _Remember that chords is specified in terms of scale degree instead of absolute notes._
  For example, `6m`.

- **`/`** Adds a blank block to this row, indicating that the chord is unchanged.

- **`bpm <BPM>`** Changes the song speed in blocks per minute.
  This affects how the chordchart is synchronized with the YouTube video.

```
1sus4 / 1 / 3sus4 / 3 /
6sus4 / 6m / 5m6 / 1 /
4sus2 / / / 3m #5dim 6m 67
2m 4m/b6 5sus4 5 1 1sus4 1 /
```