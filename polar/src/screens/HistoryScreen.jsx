import HistoryList from '../components/HistoryList'

export default function HistoryScreen({ records }) {
  return (
    <div className="px-4 pt-5">
      <h2 className="font-display text-xl font-bold text-text mb-4">Histórico</h2>
      <HistoryList records={records} />
    </div>
  )
}
