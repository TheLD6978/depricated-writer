import AdornisMixin from "../redux/adornis-mixin.js";
import { PolymerElement, html } from "@polymer/polymer/polymer-element";
import "@polymer/polymer/lib/elements/dom-if.js";
import "@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js";
import Quill from "./polymer-quill-bubble.js";
import { FlattenedNodesObserver } from "@polymer/polymer/lib/utils/flattened-nodes-observer.js";

export default class AdornisWriter extends AdornisMixin(PolymerElement) {
    constructor() {
        super();
        this._boundFocusListener = this._focusListener.bind(this);
        this._boundFormatListener = this._formatListener.bind(this);
        // Quick and dirty way for me to differatiate between my two test editors. should be removed with all log statements for demonstration
        this.identifier = Math.floor(Math.random() * 100);
        this._editorFocused = false;
    }

    static get template() {
        return html`
            <style include="quill-bubble">
                #editorContainer {
                    text-decoration-skip: objects edges box-decoration;
                }
                #editorContainer p {
                    @apply --writer-p;
                }
                #editorContainer p::first-letter {
                    @apply --writer-p-firstletter;
                }
                #editorContainer > p {
                    margin: 0;
                }
            </style>
            <link rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.9.0-alpha2/katex.min.css"
                integrity="sha384-exe4Ak6B0EoJI0ogGxjJ8rn+RN3ftPnEQrGwX59KTCl5ybGzvHGKjhPKk/KC3abb"
                crossorigin="anonymous">
            <div id="editorContainer">
                <div id="editor"></div>
            </div>
            `;
    }

    static get properties() {
        return {
            isAdmin: {
                type: Boolean,
                statePath: "isAdmin",
            },
            _disabled: {
                type: Boolean,
                computed: "_computeDisabled(isAdmin)",
                observer: "_disable",
            },
            string: {
                type: String,
                notify: true,
                // reflectToAttribute: true,
                observer: "_init",
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();

        document.addEventListener(
            "adornis-writer-focus-change",
            this._boundFocusListener,
        );
        document.addEventListener(
            "adornis-writer-format",
            this._boundFormatListener,
        );

        const Parchment = Quill.import("parchment");

        const insertNewline = (range, context, formattingChanges) => {
            // Based on modules/keyboard.js handleEnter
            if (range.length > 0) {
                this._quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
            }
            const lineFormats = Object.keys(context.format).reduce(
                (lf, format) => {
                    if (
                        Parchment.query(format, Parchment.Scope.BLOCK) &&
                        !Array.isArray(context.format[format])
                    ) {
                        lf[format] = context.format[format];
                    }
                    return lf;
                },
                {},
            );
            this._quill.insertText(
                range.index,
                "\n",
                lineFormats,
                Quill.sources.USER,
            );
            // Earlier scroll.deleteAt might have messed up our selection,
            // so insertText's built in selection preservation is not reliable
            this._quill.setSelection(range.index + 1, Quill.sources.SILENT);
            this._quill.focus();
            Object.keys(context.format).forEach(name => {
                if (lineFormats[name] != null) return;
                if (Array.isArray(context.format[name])) return;
                if (name === "link") return;
                this._quill.format(
                    name,
                    context.format[name],
                    Quill.sources.USER,
                );
            });
            this._quill.formatLine(
                range.index + 1,
                1,
                formattingChanges,
                Quill.sources.USER,
            );
        };

        const ENTER_KEY = 13;

        // This could be implemented via Parchment.Attributor.Class as well with a few modifications.
        const shiftenter = new Parchment.Attributor.Attribute(
            "shiftenter",
            "shiftenter",
        );
        Quill.register(shiftenter, true);

        this._quill = new Quill(this.$.editor, {
            theme: "bubble",
            // bounds: document.body,
            modules: {
                toolbar: [],
                formula: true,
                keyboard: {
                    bindings: {
                        "header shift enter": {
                            key: ENTER_KEY,
                            shiftKey: true,
                            collapsed: true,
                            format: ["header"],
                            suffix: /^$/,
                            handler(range, context) {
                                insertNewline(range, context, {
                                    header: false,
                                    shiftenter: true,
                                });
                                return false;
                            },
                        },
                        "header enter": {
                            key: ENTER_KEY,
                            shiftKey: false,
                            collapsed: true,
                            format: ["header"],
                            suffix: /^$/,
                            handler(range, context) {
                                insertNewline(range, context, {
                                    header: false,
                                    shiftenter: false,
                                });
                                return false;
                            },
                        },
                        "shift enter": {
                            key: ENTER_KEY,
                            shiftKey: true,
                            handler(range, context) {
                                insertNewline(range, context, {
                                    shiftenter: true,
                                });
                                return false;
                            },
                        },
                        enter: {
                            key: ENTER_KEY,
                            shiftKey: false,
                            handler(range, context) {
                                insertNewline(range, context, {
                                    shiftenter: false,
                                });
                                return false;
                            },
                        },
                    },
                },
            },
        });

        const obs = new FlattenedNodesObserver(this, update => {
            const editor = this.$.editor.querySelector(".ql-editor");

            update.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    node.innerHTML = node.innerHTML.trim();
                    editor.appendChild(node);
                } else {
                    // shouldn't happen
                    // const spanWithNode = document.createElement('span');
                    // spanWithNode.appendChild(node);
                    // editor.appendChild(spanWithNode);
                }
            });
        });

        this._quill.on("text-change", (delta, oldDelta, source) => {
            if (source === "user") {
                this.set(
                    "string",
                    this.$.editor.querySelector(".ql-editor").innerHTML,
                );
            }
        });

        this._quill.on("editor-change", (eventName, ...args) => {
            if (!this._disabled) {
                // Editor focused is not used currently
                this._editorFocused = true;
                this._lastEvent = new CustomEvent(
                    "adornis-writer-focus-change",
                    {
                        bubbles: true,
                        composed: true,
                        detail: {
                            // Pass this editor and its bounds to the toolbar.
                            editor: this._quill,
                            bounds: this.$.editor.getBoundingClientRect(),
                        },
                    },
                );
                this.dispatchEvent(this._lastEvent);
            }
        });

        // Make sure the initial properies are set
        this._disable(this._disabled);
        this._init(this.string);

        this._ensureClasses();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(
            "adornis-writer-focus-change",
            this._boundFocusListener,
        );
        // not used currently, could be discarded.
        document.removeEventListener(
            "adornis-writer-format",
            this._boundFormatListener,
        );
    }

    _init(content) {
        const editor = this.$.editor.querySelector(".ql-editor");
        const interval = setInterval(() => {
            if (!this.string) return;
            clearInterval(interval);
            if (editor) {
                if (!this.isAdmin) {
                    let katexArr = this.string.split("$");
                    katexArr = katexArr.map((entry, index) => {
                        return index % 2 === 1
                            ? katex.renderToString(entry)
                            : entry;
                    });
                    this.$.editorContainer.innerHTML = katexArr.join("");
                    return;
                }
                // if no changes, stop worrying
                if (editor.innerHTML === this.string) return;
                // TODO don't trust
                editor.innerHTML = this.string;
            }
        }, 250);

        setTimeout(() => clearInterval(interval), 10000);
    }

    _disable(disEn) {
        if (!this._quill) return;
        if (!disEn) this._quill.enable();
        else this._quill.disable();
    }

    _ensureClasses() {
        const addClass = element => {
            if (element.classList) element.classList.add("adornis-writer");
            element.childNodes.forEach(chldnode => {
                addClass(chldnode);
            });
        };
        addClass(this.$.editor);
    }

    _focusListener(e) {
        if (e !== this._lastEvent) {
            // Reset focus
            this._editorFocused = false;
        }
    }

    _formatListener(e) {
        // if (this._editorFocused) {
        // }
    }

    _computeDisabled(isAdmin) {
        return !isAdmin;
    }
}

customElements.define("adornis-writer", AdornisWriter);
