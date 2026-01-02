// global.d.ts
import { IStaticMethods } from "flyonui/flyonui";
import noUiSlider from "nouislider";
import $ from "jquery";

declare global {
  interface Window {
    // Optional third-party libraries
    _: any;
    $: typeof $;
    jQuery: typeof $;
    DataTable: any;
    Dropzone: any;

    noUiSlider: typeof noUiSlider;

    HSStaticMethods: IStaticMethods;
  }
}

export {};
