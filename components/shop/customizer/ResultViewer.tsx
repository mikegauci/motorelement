'use client'
/* eslint-disable @next/next/no-img-element */

import type { Revision } from './types'
import styles from './styles'

interface ResultViewerProps {
  status: string
  elapsed: number
  revisions: Revision[]
  viewIndex: number
  setViewIndex: (i: number) => void
  viewingUrl: string | null
  viewingTransparent: boolean
  showUnifiedCompositeResult: boolean
  renderCompositeStage: () => React.ReactNode
  resultCardRef: React.RefObject<HTMLDivElement>
}

export default function ResultViewer({
  status,
  elapsed,
  revisions,
  viewIndex,
  setViewIndex,
  viewingUrl,
  viewingTransparent,
  showUnifiedCompositeResult,
  renderCompositeStage,
  resultCardRef,
}: ResultViewerProps) {
  const isRunning = status === 'running'
  const isDone = status === 'done'
  const isError = status.startsWith('error')
  const errorMsg = isError ? status.replace('error:', '') : null

  const revCount = revisions.length
  const latestIdx = revCount > 0 ? revCount - 1 : -1
  const canGoPrev = viewIndex > 0
  const canGoNext = viewIndex < latestIdx
  const viewingLatest = revCount > 0 && viewIndex === latestIdx
  const showGeneratingOnLatest = isRunning && revCount > 0 && viewingLatest
  const showGeneratingWhileBrowsing = isRunning && revCount > 0 && !viewingLatest
  const currentLabel = revCount > 0 ? revisions[viewIndex]?.label : ''

  function renderMainResultImg(url: string, alt: string) {
    const inner = <img src={url} alt={alt || ''} className={styles.resultImg} />
    if (!viewingTransparent) {
      return <div className={styles.resultImgWrap}>{inner}</div>
    }
    return <div className={`${styles.resultImgWrap} ${styles.checkered}`}>{inner}</div>
  }

  return (
    <div className={`${styles.card} ${styles.resultCardSticky}`} ref={resultCardRef}>
      <div className={styles.cardHeader}>
        <span
          className={`${styles.badge} ${
            isDone
              ? styles.badgeDone
              : isError
              ? styles.badgeError
              : isRunning
              ? styles.badgeRunning
              : styles.badgePending
          }`}
        >
          {isDone
            ? `Done · ${elapsed}s`
            : isError
            ? 'Error'
            : isRunning
            ? `${elapsed}s…`
            : 'Waiting'}
        </span>
      </div>

      <div className={styles.cardBody}>
        {isRunning && revCount === 0 && (
          <div className={styles.spinnerWrap}>
            <div className={styles.spinner} />
            <p className={styles.spinnerText}>Generating… {elapsed}s</p>
          </div>
        )}
        {showGeneratingOnLatest && (viewingUrl || showUnifiedCompositeResult) && (
          <div
            className={`${styles.resultFrame} ${
              showUnifiedCompositeResult ? styles.resultFrameComposite : ''
            }`}
          >
            {showUnifiedCompositeResult ? renderCompositeStage() : renderMainResultImg(viewingUrl!, '')}
            <div className={styles.generatingOverlay}>
              <div className={styles.spinner} />
              <p className={styles.overlayText}>Generating new version… {elapsed}s</p>
            </div>
          </div>
        )}
        {showGeneratingWhileBrowsing && (viewingUrl || showUnifiedCompositeResult) && (
          <div className={styles.resultFrame}>
            {showUnifiedCompositeResult ? renderCompositeStage() : renderMainResultImg(viewingUrl!, '')}
            <div className={styles.revisionBanner}>
              New version generating… {elapsed}s
            </div>
          </div>
        )}
        {isDone && !isRunning && (showUnifiedCompositeResult || viewingUrl) && (
          showUnifiedCompositeResult
            ? renderCompositeStage()
            : renderMainResultImg(viewingUrl!, 'Vector result')
        )}
        {isError && (
          <div className={styles.errorWithImage}>
            {showUnifiedCompositeResult
              ? renderCompositeStage()
              : viewingUrl && renderMainResultImg(viewingUrl, '')}
            <p className={styles.errorText}>{errorMsg}</p>
          </div>
        )}
      </div>

      {revCount > 1 && (
        <div className={styles.revisionBar}>
          <button
            type="button"
            className={styles.revNav}
            onClick={() => setViewIndex(Math.max(0, viewIndex - 1))}
            disabled={!canGoPrev}
            aria-label="Previous revision"
          >
            ←
          </button>
          <span className={styles.revMeta}>
            {viewIndex + 1} / {revCount}
            {currentLabel ? ` · ${currentLabel}` : ''}
          </span>
          <button
            type="button"
            className={styles.revNav}
            onClick={() => setViewIndex(Math.min(latestIdx, viewIndex + 1))}
            disabled={!canGoNext}
            aria-label="Next revision"
          >
            →
          </button>
        </div>
      )}

      {revCount > 0 && (
        <div className={styles.revisionStrip}>
          {revisions.map((rev, i) => (
            <button
              key={`${rev.url}-${i}`}
              type="button"
              className={`${styles.revThumb} ${
                i === viewIndex ? styles.revThumbActive : ''
              } ${rev.transparent ? styles.revThumbCheckered : ''}`}
              onClick={() => setViewIndex(i)}
              title={rev.label}
            >
              <img src={rev.url} alt="" />
              <span className={styles.revThumbLabel}>{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
