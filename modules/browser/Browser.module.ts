import { Module } from "@agi-toolkit/Module";
import BrowseWeb from "./browser.command";

// TODO: Add a command to open the browser
export default class BrowserModule extends Module {
  name = "browser";
  commands = [
    new BrowseWeb(this.container)
  ];
}
