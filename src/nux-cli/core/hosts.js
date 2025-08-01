
import * as fs from "node:fs"
import context from "../../nux/context"
import { LOCAL_NUX_PATH } from "../../nux/context"
import { executeCmd } from "./installEffect";
import { dedent } from "../../nux/dedent"
import process from "node:process";

export const updateHosts = (hosts) => {
	if (!fs.existsSync(LOCAL_NUX_PATH))
		throw Error(`Nux path doesn't exist: ${LOCAL_NUX_PATH}`)

  fs.writeFileSync(`${LOCAL_NUX_PATH}/hosts.json`, JSON.stringify(hosts, null, 2), 'utf8');
  loadHosts();
};

export const loadHosts = () => {
  const hostsPath = `${LOCAL_NUX_PATH}/hosts.json`;
  let hosts = {};
  if (fs.existsSync(hostsPath)) {
    hosts = JSON.parse(fs.readFileSync(hostsPath, 'utf8'));
  }
  // console.log("LOAD HOSTS", hosts)
  context.hosts = hosts;
	return hosts
};


export const queryHostInfo = (host, user) => {
	let sh = (...args) => executeCmd({
		cmd: "/bin/sh", 
		args: ["-c", dedent(...args)]
	}, host, user)

	let info = {
		kernel_name: sh`uname -s`,  // e.g. Linux, Darwin, FreeBSD
		hostname: sh`uname -n`,  //
		architecture: sh`uname -m`,  // e.g. x86_64, arm64, aarch64
	}

	if(info.kernel_name === "Linux") {
		info.os = sh`grep "^ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"'`
		info.os_version = sh`grep "^VERSION_ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"'`
	}
	
	else if (info.kernel_name === "Darwin") {
		info.os = "macos"
		info.os_version = sh`sw_vers -productVersion`
	}

	else {
		throw Error(`${info.kernel_name} currently unsupported`)
	}

	return info
}

export const queryUserInfo = (host, user) => {
	let sh = (...args) => executeCmd({
		cmd: "/bin/sh", 
		args: ["-c", dedent(...args)]
	}, host, user)

	return {
		// name: sh`whoami`,
		uid: sh`id -u`,
		gid: sh`id -g`,
		home: sh`echo "$HOME"`,
		shell: sh`echo "$SHELL"`,
	}

}


export const hostInfo = (host, user) => {
	if(!globalThis.nuxHosts)
		globalThis.nuxHosts = loadHosts()

	user = user ?? process.env.USER
	if(!user)
		throw Error("USER environment variable not set")

	// TODO: handle host === null (local user)
	if(!globalThis.nuxHosts)
		globalThis.nuxHosts = {}

	if(!globalThis.nuxHosts[host ?? "null"])
		globalThis.nuxHosts[host ?? "null"] = {}

	if(!globalThis.nuxHosts[host ?? "null"].kernel_name) {
		console.log(`Updating OS info for ${host}`)
		globalThis.nuxHosts[host ?? "null"] = {
			...globalThis.nuxHosts[host ?? "null"],
			...queryHostInfo(host, user),
		}
	}

	if(!globalThis.nuxHosts[host ?? "null"].users)
		globalThis.nuxHosts[host ?? "null"].users = {}

	if(!globalThis.nuxHosts[host ?? "null"].users[user])
		globalThis.nuxHosts[host ?? "null"].users[user] = {}

	if(!globalThis.nuxHosts[host ?? "null"].users[user].uid) {
		console.log(`Updating user info for ${user}@${host ?? "localhost"}`)

		globalThis.nuxHosts[host ?? "null"].users[user] = {
			...globalThis.nuxHosts[host ?? "null"].users[user],
			...queryUserInfo(host, user),
		}
	}

	updateHosts(globalThis.nuxHosts)

	return globalThis.nuxHosts[host ?? "null"]
}