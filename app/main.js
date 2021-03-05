const fs = require('fs');
const { app, BrowserWindow, dialog, Menu } = require('electron');

let mainWindow = null;

app.on('ready', ()=> {

    mainWindow = new BrowserWindow({ show: true });
    Menu.setApplicationMenu(applicationMenu);
    mainWindow.loadFile(`${__dirname}/index.html`);
    
    mainWindow.once('ready-to-show', ()=> {
        mainWindow.show();
    })

})

exports.getFileFromUser = () => {
    const files = dialog.showOpenDialog(mainWindow,{
        properties: ['openFile'],
        filters: [
            {
                name: 'Markdown Files',
                extensions: ['md','markdown','mdown']
            },
            {
                name: 'Text Files',
                extensions: ['txt','text']
            }
        ]
    });

    if(!files) return;

    const file = files[0];
    
    openFile(file);
}

exports.saveMarkdown = (file, content) => {
    
    if(!file){
        file = dialog.showSaveDialog(mainWindow,{
            title: "Save Markdown",
            defaultPath: app.getPath('desktop'),
            filters: [
                { 
                    name: 'Markdown Files',
                    extensions: ['md','markdown','mdown'],
                }
            ]
        })
    } 

    if(!file) return;

    fs.writeFileSync(file,content);
    openFile(file);
}

exports.saveHtml = (content) => {
    const file = dialog.showSaveDialog(mainWindow,{
        title: 'Save HTML',
        defaultPath: app.getPath('desktop'),
        filters: [{
            name: 'HTML',
            extensions: ['html'],
        }]
    });
    
    if(!file) return;

    fs.writeFileSync(file,content);

}

const openFile = exports.openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    app.addRecentDocument(file);
    mainWindow.webContents.send('file-ready',file, content);
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open File',
                accelerator: 'CommandorControl+O',
                click() {
                    exports.getFileFromUser();
                }
            },{
                label: 'Reload',
                role: 'reload'
            },
            {
                label: 'Save File',
                accelerator: 'CommandorControl+S',
                click() {
                    mainWindow.webContents.send('save-markdown');
                }
            },
            {
                label: 'Save Html',
                click() {
                    mainWindow.webContents.send('save-html');
                }
            },
            {
                label: 'Quit',
                role: 'quit',
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Copy',
                role: 'copy'
            },
            {
                label: 'Paste',
                role: 'paste',
            },
            {
                label: 'Cut',
                role: 'cut',
            },
            {
                label: 'Select All',
                role: 'selectAll'
            },
            {
                label: 'Undo',
                role: 'undo'
            },
            {
                label: 'Redo',
                role: 'redo'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                role: 'toggleDevTools'
            }
        ]
    }
]; 

if( process.platform === 'darwin' ) {
    const applciationName = "Md-Html";
    menuTemplate.unshift({
        label: applciationName,
        submenu: [
            {
                label: 'About',
                click() {
                    console.log("About");
                }
            },
            {
                label: 'Quit',
                role: 'quit',
            }
        ]
    })
}

const applicationMenu = Menu.buildFromTemplate(menuTemplate);

console.log("Starting applciation...");