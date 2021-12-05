export const parseQuery = url => {
  const res = []
  if (url.indexOf('?') < 0) return res

  url
    .split('?')[1]
    .split('&')
    .forEach(kv => {
      const [key, value] = kv.split('=')
      if (key !== '' || value !== '') {
        res.push([key, value])
      }
    })

  return res
}

export const buildQuery = (host, queryArray) => {
  return (
    host +
    (queryArray.length ? '?' : '') +
    queryArray.map(([key, val]) => `${key}=${val}`).join('&')
  )
}
