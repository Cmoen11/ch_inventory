import { useEffect, useState } from "react";

function useKeypress(key, action) {
	useEffect(() => {
		function onKeyup(e) {
			if (e.key === key) action();
		}
		window.addEventListener("keyup", onKeyup);
		return () => window.removeEventListener("keyup", onKeyup);
	}, [action]);
}

export default useKeypress;
