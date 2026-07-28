export default new class PirateBay {
  base = 'https://apibay.org/q.php'

  /** @type {import('./').SearchFunction} */
  async single ({ titles, episode, fetch }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const url = `${this.base}?q=${encodeURIComponent(query)}`

    const res = await fetch(url)
    const data = await res.json()

    if (!Array.isArray(data)) return []

    return this.map(data)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  buildQuery (title, episode) {
    let query = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return query
  }

  map (data) {
    return data.filter(item => item.id !== '0' && item.info_hash && !/^0+$/.test(item.info_hash)).map(item => {
      return {
        title: item.name || '',
        link: `magnet:?xt=urn:btih:${item.info_hash}`,
        hash: item.info_hash,
        seeders: parseInt(item.seeders || '0'),
        leechers: parseInt(item.leechers || '0'),
        downloads: 0,
        size: parseInt(item.size || '0'),
        date: new Date(parseInt(item.added || '0') * 1000),
        type: 'alt',
        accuracy: 'low'
      }
    })
  }

  async test () {
    try {
      const res = await fetch(this.base + '?q=one+piece')
      return res.ok
    } catch {
      return false
    }
  }
}()
