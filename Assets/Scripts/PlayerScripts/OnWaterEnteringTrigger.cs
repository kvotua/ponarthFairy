using UnityEngine;

public class OnWaterEnteringTrigger : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    private Rigidbody rigidbody;
    public float floatUpSpeedLimit = 1.30f;
    public float floatUpSpeed = 1.2f;

    private void Start()
    {
        rigidbody = GetComponent<Rigidbody>();
    }
    private void OnTriggerStay(Collider other)
    {
        if (other.gameObject.layer == 6)
        {
            float difference = (other.transform.position.y - transform.position.y) * floatUpSpeed;
            rigidbody.AddForce(new Vector3(0f, Mathf.Clamp((Mathf.Abs(Physics.gravity.y) * difference), 0, Mathf.Abs(Physics.gravity.y) * floatUpSpeedLimit), 0f), ForceMode.Acceleration);
            rigidbody.linearDamping = 0.99f;
            rigidbody.angularDamping = 0.8f;
            PlayerWalking._maxPlayerSpeed = 2.4f;
            PlayerWalking._playerAccelaration = 0.02f;
        }
    }
    private void OnTriggerExit(Collider other)
    {
        if (other.gameObject.layer == 6)
        {
            rigidbody.linearDamping = 0f;
            rigidbody.angularDamping = 0f;
            PlayerWalking._maxPlayerSpeed = 4f;
            PlayerWalking._playerAccelaration = 0.1f;
        }
    }
}
