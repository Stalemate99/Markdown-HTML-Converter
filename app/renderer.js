const { remote, ipcRenderer, shell } = require('electron');
const marked = require('marked');
const path = require('path');

// DOM variables
const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

let filePath = null;
let originalContent = '';

const mainProcess = remote.require('./main');
const currentWindow = remote.getCurrentWindow();

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = isEdited => {

  let title = 'Markdown to HTML Converter';
  if(filePath)
    title = `${title} - ${path.basename(filePath)}`;
  
  if(isEdited)
    title += ' *';
  
  showFileButton.disabled = !filePath;
  openInDefaultButton.disabled = !filePath;

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;

  currentWindow.setTitle(title);

}

markdownView.addEventListener('keyup', event => {
  let currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser();
});

const saveHtml = () => {
  mainProcess.saveHtml(htmlView.innerHTML);
};

saveHtmlButton.addEventListener('click', saveHtml);

ipcRenderer.on('save-html', saveHtml);

const saveMarkdown = () => {
  mainProcess.saveMarkdown(filePath,markdownView.value);
}

saveMarkdownButton.addEventListener('click', saveMarkdown);

ipcRenderer.on('save-markdown', saveMarkdown);

revertButton.addEventListener('click',() => {
  markdownView.value = originalContent;
});

showFileButton.addEventListener('click', (event)=> {
  if(!filePath){
    return alert("OPEN A FILE TO SHOW?");
  }
  shell.showItemInFolder(filePath);
});

openInDefaultButton.addEventListener('click', ()=> {
  if(!filePath){
    return alert("OPEN A FILE TO SHOW?");
  } 
  shell.openItem(filePath);

});

ipcRenderer.on('file-ready', (event, file, content) => {

  filePath = file;
  originalContent = content;
  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface(false);

})


document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

const getDraggedFile = (event) => event.dataTransfer.files[0];
const getDroppedFile = (event) => event.dataTransfer.items[0];
const fileTypeIsSupported = file => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover',(event)=>{
  const file = getDraggedFile(event);

  if(fileTypeIsSupported(file)){
    markdownView.classList.add('drag-over');
  }
  else{
    markdownView.classList.add('drag-error');
  }
});


markdownView.addEventListener('dragleave', ()=> {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event);
  if(fileTypeIsSupported(file)){
    mainProcess.openFile(file.path);
  } else {
    alert("FILE TYPE NOT SUPPORTED!");
  }

  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');

})