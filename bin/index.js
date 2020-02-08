#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const os = require('os').platform();
const fs = require('fs');

(async function () {

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(subject) {
        return new Promise((resolve, reject) => {
            readline.question(subject + ' ', (ans) => { resolve(ans); });
        });
    }

    console.log('以下將會協助你進行 Git 版控環境設定：');
    console.log();

    const name = await ask(`請問您的顯示名稱？`);
    const email = await ask(`請問您的 E-mail 地址？`);

    if (!name) {
        console.error('You MUST configure user.name setting!');
        return;
    }

    if (!validateEmail(email)) {
        console.error('You MUST configure user.email setting!');
        return;
    }

    console.log();
    console.log('開始進行 Git 環境設定');
    console.log('------------------------------------------');

    await cmd(`git config --global user.name  ${name}`);
    await cmd(`git config --global user.email  ${email}`);

    await cmd("git config --global help.autocorrect 30");

    await cmd("git config --global core.autocrlf false");
    await cmd("git config --global core.quotepath false");

    await cmd("git config --global color.diff auto");
    await cmd("git config --global color.status auto");
    await cmd("git config --global color.branch auto");

    await cmd("git config --global alias.ci   commit");
    await cmd("git config --global alias.cm   \"commit --amend -C HEAD\"");
    await cmd("git config --global alias.co   checkout");
    await cmd("git config --global alias.st   status");
    await cmd("git config --global alias.sts  \"status -s\"");
    await cmd("git config --global alias.br   branch");
    await cmd("git config --global alias.re   remote");
    await cmd("git config --global alias.di   diff");
    await cmd("git config --global alias.type \"cat-file -t\"");
    await cmd("git config --global alias.dump \"cat-file -p\"");
    await cmd("git config --global alias.lo   \"log --oneline\"");
    await cmd("git config --global alias.ll   \"log --pretty=format:'%h %ad | %s%d [%Cgreen%an%Creset]' --graph --date=short\"");
    await cmd("git config --global alias.lg   \"log --graph --pretty=format:'%Cred%h%Creset %ad |%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset [%Cgreen%an%Creset]' --abbrev-commit --date=short\"");
    await cmd("git config --global alias.alias \"config --get-regexp ^alias\\.\"");

    if (os === 'win32' && fs.existsSync('C:/PROGRA~1/TortoiseGit/bin/TortoiseGitProc.exe')) {
        await cmd("git config --global alias.tlog \"!start 'C:\\PROGRA~1\\TortoiseGit\\bin\\TortoiseGitProc.exe' /command:log /path:.");
    }

    if (os === 'win32') {
        await cmd("git config --global core.editor notepad");
    }

    if (!process.env.LC_ALL) {
        if (os === 'win32') {
            await cmd("SETX LC_ALL C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LC_ALL=C.UTF-8");
        }
    }

    if (!process.env.LANG) {
        if (os === 'win32') {
            await cmd("SETX LANG C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LANG=C.UTF-8");
        }
    }

    readline.close();
})();

async function cmd(command) {
    console.log(command);
    const { stdout, stderr } = await exec(command);
    if (stderr) {
        console.debug(stderr);
        return;
    }
    if (stdout) {
        console.log(stdout);
    }
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}