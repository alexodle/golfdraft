import css from 'styled-jsx/css'

export const bootstrappy = css.global`
ul, ol {
  margin-top: 0;
  margin-bottom: 10px;
}

p {
  margin: 0 0 10px;
}

.list-unstyled {
  list-style-type: none;
  list-style: none;
  padding-left: 0;
}

h1, h2, h3, h4 {
  font-weight: 500;
  line-height: 1.1;
  margin-top: 20px;
  margin-bottom: 10px;
}

h1 small, h2 small, h3 small, h4 small {
  color: #777;
  font-size: 65%;
  font-weight: 400;
}

h1 {
  font-size: 36px;
}
h4 {
  margin-top: 0;
}

select, input {
  border: 1px solid #eee;
  border-radius: 10px;
  margin: 10px 0;
  font-size: 15px;
  line-height: 1.5em;
  padding: 5px;
  width: 100%;
}

.btn {
  touch-action: manipulation;
  border: 1px solid transparent;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-default {
  background-color: #fff;
  border-color: #ccc;
}
.btn-primary {
  color: #fff;
  background-color: #337ab7;
  border-color: #2e6da4;
}
.btn.disabled, .btn[disabled] {
  cursor: not-allowed;
  opacity: .65;
}
.btn.active, .btn:active {
  background-image: none;
  outline: 0;
  box-shadow: inset 0 3px 5px rgba(0,0,0,.125);
}
.btn-default.active, .btn-default:active {
  color: #333;
  background-color: #e6e6e6;
  background-image: none;
  border-color: #adadad;
}

button.btn-primary, input[type=submit].btn {
  background-color: #1976d2;
  color: #fff;
}

a {
  color: #337ab7;
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}

.panel {
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 20px;
}
.panel .panel-heading {
  background-color: #f5f5f5;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
}
.panel .panel-heading .panel-title {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 16px;
}
.panel .panel-body {
  padding: 15px;
}

table {
  width: 100%;
  margin-bottom: 20px;
  border-collapse: collapse;
  border-spacing: 0;
  border: 0;
}
table th {
  text-align: left;
  border-top: 0;
  vertical-align: bottom;
  border-bottom: 2px solid #ddd;
}
table td {
  vertical-align: top;
  border-top: 1px solid #ddd;
}
table th, table td {
  padding: 8px;
}
@media only screen and (max-width: 920px) {
  table .hidden-xs {
    display: none !important;
  }
  table .visible-xs {
    display: table-cell !important;
  }
}

.visible-xs {
  display: none;
}

.dl-horizontal {
  display: grid;
  grid-template-columns: 230px 1fr;
  column-gap: 10px;
}
.dl-horizontal dd {
  padding-left: 0;
  margin-left: 0;
}

@media only screen and (max-width: 920px) {
  .dl-horizontal {
    grid-template-columns: 150px 1fr;
    column-gap: 5px;
  }
}

.jumbotron {
  padding: 48px 60px;
  margin-bottom: 30px;
  border-radius: 6px;
  background-color: #eee;
}
.jumbotron h1 {
  font-size: 63px;
}
.jumbotron p {
  margin-bottom: 15px;
  font-size: 21px;
  font-weight: 200;
}

.label {
  display: inline;
  padding: .2em .6em .3em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: .25em;
}
.label-default {
  background-color: #777;
}
.label-info {
  background-color: #5bc0de;
}
.label-success {
  background-color: #5cb85c;
}

.btn-group {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}
.btn-group >.btn:not(:first-child):not(:last-child):not(.dropdown-toggle) {
  border-radius: 0;
}
.btn-group >.btn.active, .btn-group >.btn:active, .btn-group >.btn:focus, .btn-group >.btn:hover {
  z-index: 2;
}
.btn-group >.btn {
  position: relative;
  float: left;
}
.btn-group .btn+.btn, .btn-group .btn+.btn-group, .btn-group +.btn, .btn-group +.btn-group {
  margin-left: -1px;
}
.btn-group >.btn:last-child:not(:first-child), .btn-group >.dropdown-toggle:not(:first-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
`
