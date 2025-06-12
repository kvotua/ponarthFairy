using UnityEngine;

public class DeleteUIOnPC : MonoBehaviour
{
    [SerializeField] private Canvas canvas;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        #if UNITY_ANDROID
            return;
#endif
        Destroy(canvas);
    }

}
