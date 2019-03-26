import { Element, html } from "../../@polymer/polymer/polymer-element";
import * as q from "./quill";
// Install this :3
import * as Delta from "quill-delta";

// This code NEEDS refactoring. Sorry in advance. (All the updateContents functions could be unified into one function probably)
// Useful Rescources are:
// https://quilljs.com/docs/quickstart/
// https://github.com/quilljs/delta#retain

export class AdornisWriterToolbar extends Element {
    constructor() {
        super();
        this._boundFocusListener = this._focusListener.bind(this);
    }
    static get template() {
        return html`
            <style>
            :host {
                position: fixed;
            }
            button {
                background: none;
                border: none;
                cursor: pointer;
                display: inline-block;
                float: left;
                height: 24px;
                padding: 3px 5px;
                width: 28px;
            }
            button svg {
                float: left;
                height: 100%;
            }
            button:hover,
            button:hover,
            button:focus,
            button:focus,
            button.ql-active,
            button.ql-active {
                color: #fff;
            }
            button:hover .ql-fill,
            button:hover .ql-fill,
            button:focus .ql-fill,
            button:focus .ql-fill,
            button.ql-active .ql-fill,
            button.ql-active .ql-fill {
                fill: #fff;
            }
            button:hover .ql-stroke,
            button:hover .ql-stroke,
            button:focus .ql-stroke,
            button:focus .ql-stroke,
            button.ql-active .ql-stroke,
            button.ql-active .ql-stroke {
                stroke: #fff;
            }
            @media (pointer: coarse) {
                button:hover:not(.ql-active),
                button:hover:not(.ql-active) {
                    color: #ccc;
                }
                button:hover:not(.ql-active) .ql-fill,
                button:hover:not(.ql-active) .ql-fill,
                button:hover:not(.ql-active) .ql-stroke.ql-fill,
                button:hover:not(.ql-active) .ql-stroke.ql-fill {
                    fill: #ccc;
                }
                button:hover:not(.ql-active) .ql-stroke,
                button:hover:not(.ql-active) .ql-stroke,
                button:hover:not(.ql-active) .ql-stroke-miter,
                button:hover:not(.ql-active) .ql-stroke-miter {
                    stroke: #ccc;
                }
            }
            .ql-formats {
                display: inline-block;
                vertical-align: middle;
                background-color: #444;
            }
            .ql-formats:after {
                clear: both;
                content: '';
                display: table;
            }
            .ql-stroke {
                fill: none;
                stroke: #ccc;
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-width: 2;
            }
            .ql-fill,
            .ql-stroke.ql-fill {
                fill: #ccc;
            }
            .ql-even {
                fill-rule: evenodd;
            }
            input {
                display: none;
            }
            .ql-formats.ql-input button {
                display: none;
            }
            .ql-formats.ql-input input[type=text] {
                display: inline-block;
            }
            </style>
            <span id="container" class="ql-formats">
                <button type="button" on-click="handleFormat" class="ql-bold">
                    <svg viewBox="0 0 18 18">
                        <path class="ql-stroke" d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z"></path>
                        <path class="ql-stroke" d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z"></path>
                    </svg>
                </button>
                <button type="button" on-click="handleFormat" class="ql-italic">
                    <svg viewBox="0 0 18 18">
                        <line class="ql-stroke" x1="7" x2="13" y1="4" y2="4"></line>
                        <line class="ql-stroke" x1="5" x2="11" y1="14" y2="14"></line>
                        <line class="ql-stroke" x1="8" x2="10" y1="14" y2="4"></line>
                    </svg>
                </button>
                <button type="button" on-click="handleFormat" class="ql-link">
                    <svg viewBox="0 0 18 18">
                        <line class="ql-stroke" x1="7" x2="11" y1="7" y2="11"></line>
                        <path class="ql-even ql-stroke" d="M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z"></path>
                        <path class="ql-even ql-stroke" d="M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z"></path>
                    </svg>
                </button>
                <button type="button" on-click="handleFormat" class="ql-image">
                    <svg viewBox="0 0 18 18">
                        <rect class="ql-stroke" height="10" width="12" x="3" y="4"></rect>
                        <circle class="ql-fill" cx="6" cy="7" r="1"></circle>
                        <polyline class="ql-even ql-fill" points="5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12"></polyline>
                    </svg>
                </button>
                <button type="button" on-click="handleFormat" class="ql-formula">
                    <svg viewBox="0 0 18 18">
                        <path class="ql-fill" d="M11.759,2.482a2.561,2.561,0,0,0-3.53.607A7.656,7.656,0,0,0,6.8,6.2C6.109,9.188,5.275,14.677,4.15,14.927a1.545,1.545,0,0,0-1.3-.933A0.922,0.922,0,0,0,2,15.036S1.954,16,4.119,16s3.091-2.691,3.7-5.553c0.177-.826.36-1.726,0.554-2.6L8.775,6.2c0.381-1.421.807-2.521,1.306-2.676a1.014,1.014,0,0,0,1.02.56A0.966,0.966,0,0,0,11.759,2.482Z"></path>
                        <rect class="ql-fill" height="1.6" rx="0.8" ry="0.8" width="5" x="5.15" y="6.2"></rect>
                        <path class="ql-fill" d="M13.663,12.027a1.662,1.662,0,0,1,.266-0.276q0.193,0.069.456,0.138a2.1,2.1,0,0,0,.535.069,1.075,1.075,0,0,0,.767-0.3,1.044,1.044,0,0,0,.314-0.8,0.84,0.84,0,0,0-.238-0.619,0.8,0.8,0,0,0-.594-0.239,1.154,1.154,0,0,0-.781.3,4.607,4.607,0,0,0-.781,1q-0.091.15-.218,0.346l-0.246.38c-0.068-.288-0.137-0.582-0.212-0.885-0.459-1.847-2.494-.984-2.941-0.8-0.482.2-.353,0.647-0.094,0.529a0.869,0.869,0,0,1,1.281.585c0.217,0.751.377,1.436,0.527,2.038a5.688,5.688,0,0,1-.362.467,2.69,2.69,0,0,1-.264.271q-0.221-.08-0.471-0.147a2.029,2.029,0,0,0-.522-0.066,1.079,1.079,0,0,0-.768.3A1.058,1.058,0,0,0,9,15.131a0.82,0.82,0,0,0,.832.852,1.134,1.134,0,0,0,.787-0.3,5.11,5.11,0,0,0,.776-0.993q0.141-.219.215-0.34c0.046-.076.122-0.194,0.223-0.346a2.786,2.786,0,0,0,.918,1.726,2.582,2.582,0,0,0,2.376-.185c0.317-.181.212-0.565,0-0.494A0.807,0.807,0,0,1,14.176,15a5.159,5.159,0,0,1-.913-2.446l0,0Q13.487,12.24,13.663,12.027Z"></path>
                    </svg>
                </button>
                <!-- to add more stylings, just add more buttons with on-click="handleFormat" and the appropriate class. If there are more formats that require user Input or are Embeds they must be handled separately. Simple toggle styles like strike or headings should be fine though. Could be that to add these more CSS is required too. SVGS can be found in the quill source: quill/assets/icons-->
            </span>
            `;
    }
    static get properties() {
        return {};
    }
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener("adornis-writer-focus-change", this._boundFocusListener);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener("adornis-writer-focus-change", this._boundFocusListener);
    }
    _focusListener(e) {
        // remeber the last clicked editor
        this._quill = e.detail.editor;
        // to move the bar into place later -> combine with getClientBoundingRect (passed by the editors in e.details.bounds) for fixed pos
        // check if selection exists before getting bounds
        // console.log(this._quill.getBounds(this._quill.getSelection()));

        // Maybe use a general Mouse.click Listener to hide the toolbar? If doing so remember to reset the input stuff if the bar is showing a text field using this._hideInput -> see this._inputShown
    }
    _getButtonFromEvent(event) {
        let button;
        event.path.forEach(element => {
            if (element.type === "button" && button === undefined) {
                button = element;
            }
        });
        return button;
    }
    handleFormat(event) {
        // this.dispatchEvent(
        //     new CustomEvent("adornis-writer-format", {
        //         detail: { text: "lolol" },
        //         bubbles: true,
        //         composed: true,
        //     }),
        // );
        let button = this._getButtonFromEvent(event);
        // the format the button should toggle is stored in its classList. We could get rid of these ql- prefixes...
        // if some simple formats require static inputs, maybe handle them with attributes and pass them to the format function. Thinking of sub and superscript right now.
        let format = button.classList[0].slice(3);
        if (this._quill && format) {
            // if its an embed handle somewhere else...
            if (["link", "image", "formula"].includes(format)) {
                this.handleEmbed(format);
            } else {
                let formats = this._quill.getFormat();
                this._quill.format(format, !formats[format], "user");
            }
        }
    }
    // most of this is stolen from the quill source -> see quill/themes/base.js|bubble.js or quill/modules/toolbar.js for more infos
    handleEmbed(format) {
        console.log("handle " + format);
        if (format === "image") {
            let fileInput = this.$.container.querySelector("input[type=file]");
            // Create file Input if it doesnt exist already
            if (fileInput == null) {
                fileInput = document.createElement("input");
                fileInput.setAttribute("type", "file");
                fileInput.setAttribute("accept", "image/png, image/gif, image/jpeg, image/bmp, image/x-icon");
                fileInput.addEventListener("change", () => {
                    if (fileInput.files != null && fileInput.files[0] != null) {
                        let reader = new FileReader();
                        reader.onload = e => {
                            let range = this._quill.getSelection(true);
                            this._quill.updateContents(
                                new Delta()
                                    .retain(range.index)
                                    .delete(range.length)
                                    .insert({ image: e.target.result }),
                                "user",
                            );
                            this._quill.setSelection(range.index + 1, "silent");
                            fileInput.value = "";
                        };
                        reader.readAsDataURL(fileInput.files[0]);
                    }
                });
                this.$.container.appendChild(fileInput);
            }
            // open input
            fileInput.click();
        }
        if (format === "formula") {
            let range = this._quill.getSelection(true);
            if (range) {
                if (range.length === 0) {
                    // ask for input? The eventhandler in _showInput has to be modified to enable this.
                } else {
                    let text = this._quill.getText(range.index, range.length);
                    this._quill.updateContents(
                        new Delta()
                            .retain(range.index)
                            .delete(range.length)
                            .insert({ formula: text }),
                        "user",
                    );
                }
            }
        }
        if (format === "link") {
            this._showInput();
        }
        console.log("Embedding " + format);
    }
    _showInput() {
        this._inputShown = true;
        let textInput = this.$.container.querySelector("input[type=text]");
        if (textInput == null) {
            // if not already present create text input and attach event handler
            textInput = document.createElement("input");
            textInput.setAttribute("type", "text");
            // Currently the event handler only handles links.
            textInput.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    let range = this._quill.getSelection(true);
                    if (range) {
                        if (range.length === 0) {
                            this._quill.updateContents(
                                new Delta().retain(range.index).insert(textInput.value, {
                                    link: textInput.value,
                                }),
                                "user",
                            );
                        } else {
                            // should only occur when embedding a link
                            this._quill.updateContents(
                                new Delta().retain(range.index).retain(range.length, { link: textInput.value }),
                                "user",
                            );
                        }
                    }
                    this._hideInput();
                    event.preventDefault();
                }
                if (event.key === "Escape") {
                    this._hideInput();
                    event.preventDefault();
                }
            });
            this.$.container.appendChild(textInput);
        }
        textInput.value = "";
        textInput.click();
        this.$.container.classList.add("ql-input");
    }
    _hideInput() {
        this._inputShown = false;
        this.$.container.classList.remove("ql-input");
    }
}

customElements.define("adornis-writer-toolbar", AdornisWriterToolbar);
