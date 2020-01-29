document.write(`
<title>dtinth’s interactive chordbook</title>
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link
  rel="stylesheet"
  href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
  integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
  crossorigin="anonymous"
/>
<link rel="stylesheet" href="lib/style.css" />
<div id="app" class="container">
  <h2>Loading chordbook...</h2>
</div>
<script defer src="vendor/sharp11-harmony.js?v=1564040417552"></script>
<script defer src="https://unpkg.com/vue@2.6.10/dist/vue.js"></script>
<script defer src="https://unpkg.com/vue-youtube-embed@2.2.2/lib/vue-youtube-embed.umd.js"></script>
<script defer src="https://unpkg.com/curve-interpolator@1.0.5/dist/index.js"></script>
<script defer src="lib/script.js"></script>
`)
