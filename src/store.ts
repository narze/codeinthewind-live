import {
  child,
  DatabaseReference,
  DataSnapshot,
  onValue,
  ref,
} from 'firebase/database'
import { memoize } from 'lodash-es'
import { database } from './firebase'

const roomRef = ref(database, 'rooms/citw')
const configRef = child(roomRef, 'config')
const stageRef = child(configRef, 'stage')

function firebaseStore<T>(
  ref: DatabaseReference,
  converter: (f: DataSnapshot) => T,
  defaultValue: T,
): SvelteStore<T> {
  return {
    subscribe: (set) => {
      let alreadySet = false
      const unsubscribe = onValue(ref, (snapshot) => {
        set(converter(snapshot))
        alreadySet = true
      })
      if (!alreadySet) {
        set(defaultValue)
      }
      return unsubscribe
    },
  }
}

export const stage = firebaseStore(
  stageRef,
  (snapshot) => {
    const users: string[] = []
    snapshot.forEach((item) => {
      users.push(item.val())
    })
    return users
  },
  [],
)

export type Submission = {
  html: string
  css: string
  compiledCss: string
}

export const contestantSubmission = memoize((uid: string) => {
  const submissionRef = child(roomRef, `publicSubmissions/${uid}/data`)
  return firebaseStore<Submission | undefined>(
    submissionRef,
    (snapshot) => {
      try {
        const data = JSON.parse(String(snapshot.val()))
        return {
          html: String(data.html),
          css: String(data.css),
          compiledCss: String(data.compiledCss),
        }
      } catch (error) {
        return {
          html: 'ERROR: ' + error,
          css: '',
          compiledCss: '',
        }
      }
    },
    undefined,
  )
})
