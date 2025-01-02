
import  * as fs  from '../node/fs.js'


export const loadRepo = (dir, other={}) => {
  return new Proxy({}, {
    get(target, key) {
			
			if(key in other)
				return other[key]
			
			
			let path = [
				`${dir}/hosts/${key}.js`,
				`${dir}/hosts/${key}/index.js`,
				`${dir}/systems/${key}.js`,
				`${dir}/systems/${key}/index.js`,
				`${dir}/systest/${key}.js`,
				`${dir}/systest/${key}.js`,
				`${dir}/systems/${key}/index.js`,

			].find(path => fs.existsSync(path))
			
			if(path)
				return async () => (await import(path)).default

			return undefined;
    }
  });
};
