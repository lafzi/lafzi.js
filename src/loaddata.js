export default async function loadData () {
	let buffer = {}
	let [data_muqathaat, data_index_v, data_index_nv, data_posmap_v, data_posmap_nv, data_quran_teks, data_quran_trans_indonesian] = await Promise.all([
    import('../loader/data_muqathaat'),
    import('../loader/data_index_v'),
    import('../loader/data_index_nv'),
    import('../loader/data_posmap_v'),
    import('../loader/data_posmap_nv'),
    import('../loader/data_quran_teks'),
    import('../loader/data_quran_trans_indonesian')
  ])
  buffer.muqathaat = data_muqathaat.default
  buffer.index_v = data_index_v.default
  buffer.index_nv = data_index_nv.default
  buffer.posmap_v = data_posmap_v.default
  buffer.posmap_nv = data_posmap_nv.default
  buffer.quran_teks = data_quran_teks.default
  buffer.quran_trans_indonesian = data_quran_trans_indonesian.default
	return buffer;
}