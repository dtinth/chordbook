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

For example, in a song with C major key, these diatonic chords can be represented as scale degrees as follows:

For example, in a song with E major key, these diatonic chords can be represented as scale degrees as follows:

| E | F#m | G#m | A | B | C#m | D#dim |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2m | 3m | 4 | 5 | 6m | 7dim |

### Directives

- **`scale <Note> <Scale>`** declares the scale to be used.

  ```
  scale E major
  ```

- **`youtube <ID>`** specifies the YouTube video ID.

  ```
  youtube KEqiqYXuaj8
  ```