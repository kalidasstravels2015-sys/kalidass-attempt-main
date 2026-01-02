const ChidambaramNatarajarTemple = new Proxy({"src":"/_astro/Chidambaram-Natarajar-Temple.DiOQjX73.jpg","width":900,"height":675,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Chidambaram-Natarajar-Temple.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Chidambaram-Natarajar-Temple.jpg");
							return target[name];
						}
					});

export { ChidambaramNatarajarTemple as default };
